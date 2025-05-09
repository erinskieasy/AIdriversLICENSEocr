import OpenAI from "openai";
import { OpenAIResponse } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Define the Multer File interface if Express.Multer is not available
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

export async function processImagesWithOpenAI(
  apiKey: string,
  assistantId: string,
  files: MulterFile[]
): Promise<OpenAIResponse> {
  console.log(`[OpenAI Service] Starting image processing with ${files.length} files`);
  console.log(`[OpenAI Service] Using Assistant ID: ${assistantId}`);
  console.log(`[OpenAI Service] API Key provided: ${apiKey ? 'Yes (masked)' : 'No'}`);
  
  try {
    // Initialize OpenAI with the provided API key
    console.log("[OpenAI Service] Initializing OpenAI client");
    const openai = new OpenAI({ apiKey });

    // Upload all images to OpenAI
    console.log("[OpenAI Service] Uploading images to OpenAI");
    const fileIds = await Promise.all(
      files.map(async (file, index) => {
        console.log(`[OpenAI Service] Uploading file ${index + 1}/${files.length}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
        
        // Create a temporary file from the buffer to work with OpenAI API
        const tempFilePath = path.join('/', 'tmp', `temp_file_${Date.now()}_${index}.jpg`);
        fs.writeFileSync(tempFilePath, file.buffer);
        
        try {
          const uploadedFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: "assistants",
          });
          console.log(`[OpenAI Service] File ${index + 1} uploaded with ID: ${uploadedFile.id}`);
          
          // Clean up temporary file after upload
          fs.unlinkSync(tempFilePath);
          
          return uploadedFile.id;
        } catch (error) {
          console.error(`[OpenAI Service] Error uploading file ${index + 1}:`, error);
          
          // Clean up temporary file in case of error
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          
          throw error;
        }
      })
    );
    console.log(`[OpenAI Service] All files uploaded successfully. File IDs: ${fileIds.join(', ')}`);

    // Create a thread
    console.log("[OpenAI Service] Creating a new thread");
    const thread = await openai.beta.threads.create();
    console.log(`[OpenAI Service] Thread created with ID: ${thread.id}`);

    // Add a message to the thread with all the images
    console.log("[OpenAI Service] Adding message with images to thread");
    
    // Create properly typed content for the message
    // Using OpenAI's required format for messages
    const textContent = {
      type: "text" as const,
      text: "Please analyze these images according to you knowledge base and provide a detailed JSON response with your findings."
    };
    
    const imageContents = files.map((file, index) => ({
      type: "image_file" as const,
      image_file: { file_id: fileIds[index] }
    }));
    
    // Combine text and image content in the format OpenAI expects
    const messageContent = [textContent, ...imageContents];
    
    console.log("[OpenAI Service] Message content created with 1 text part and", imageContents.length, "image parts");

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: messageContent,
    });
    console.log("[OpenAI Service] Message with images added to thread");

    // Run the assistant
    console.log(`[OpenAI Service] Starting assistant run with assistant ID: ${assistantId}`);
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: "Analyze the uploaded images and provide a comprehensive JSON response. Structure your analysis with keys for 'objects', 'scene', 'colors', 'text', and any other relevant attributes. Be detailed but structured.",
      response_format: { type: "json_object" },
    });
    console.log(`[OpenAI Service] Run created with ID: ${run.id}`);

    // Poll for the run to complete
    console.log("[OpenAI Service] Polling for run completion");
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log(`[OpenAI Service] Initial run status: ${runStatus.status}`);
    
    let pollCount = 0;
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      // Wait for 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      pollCount++;
      
      if (pollCount % 5 === 0) {
        console.log(`[OpenAI Service] Current run status: ${runStatus.status} (poll count: ${pollCount})`);
      }
      
      if (runStatus.status === "requires_action") {
        console.log("[OpenAI Service] Run requires action, which is not expected in this flow");
        throw new Error("The assistant requires additional input to complete the task");
      }
    }

    console.log(`[OpenAI Service] Run completed with final status: ${runStatus.status}`);

    if (runStatus.status === "failed") {
      console.error(`[OpenAI Service] Run failed with error: ${runStatus.last_error?.message}`);
      throw new Error(
        runStatus.last_error?.message || 
        "The assistant failed to process the images"
      );
    }

    // Get the assistant's response
    console.log("[OpenAI Service] Retrieving assistant messages");
    const messages = await openai.beta.threads.messages.list(thread.id);
    console.log(`[OpenAI Service] Retrieved ${messages.data.length} messages`);
    
    // Find the last assistant message
    const assistantMessages = messages.data.filter(
      msg => msg.role === "assistant"
    );
    console.log(`[OpenAI Service] Found ${assistantMessages.length} assistant messages`);
    
    if (assistantMessages.length === 0) {
      console.error("[OpenAI Service] No assistant messages found");
      throw new Error("No response received from the assistant");
    }

    // Get the latest assistant message
    const latestMessage = assistantMessages[0];
    console.log(`[OpenAI Service] Latest message ID: ${latestMessage.id}`);
    
    // Get the raw text content without attempting to parse it
    let rawResponse = null;
    
    console.log(`[OpenAI Service] Processing message content with ${latestMessage.content.length} content parts`);
    for (const contentPart of latestMessage.content) {
      console.log(`[OpenAI Service] Content part type: ${contentPart.type}`);
      if (contentPart.type === "text") {
        const contentText = contentPart.text.value;
        console.log(`[OpenAI Service] Got text content (${contentText.length} chars)`);
        rawResponse = contentText;
        console.log("[OpenAI Service] Using raw text content from OpenAI");
        break;
      }
    }

    // Clean up uploaded files
    console.log("[OpenAI Service] Cleaning up uploaded files");
    await Promise.all(
      fileIds.map(async (fileId, index) => {
        try {
          console.log(`[OpenAI Service] Deleting file ${index + 1}/${fileIds.length}: ${fileId}`);
          await openai.files.del(fileId);
          console.log(`[OpenAI Service] File ${fileId} deleted successfully`);
        } catch (error) {
          console.error(`[OpenAI Service] Failed to delete file ${fileId}:`, error);
        }
      })
    );

    console.log("[OpenAI Service] Processing completed successfully");
    return {
      data: rawResponse,
    };
  } catch (error: any) {
    console.error("[OpenAI Service] Processing error:", error);
    console.error(`[OpenAI Service] Error message: ${error.message}`);
    if (error.stack) {
      console.error(`[OpenAI Service] Error stack: ${error.stack}`);
    }
    
    return {
      error: error.message || "An error occurred while processing with OpenAI",
    };
  }
}
