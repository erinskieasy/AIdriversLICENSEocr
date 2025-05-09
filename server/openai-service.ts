import OpenAI from "openai";
import { OpenAIResponse } from "@shared/schema";

export async function processImagesWithOpenAI(
  apiKey: string,
  assistantId: string,
  files: Express.Multer.File[]
): Promise<OpenAIResponse> {
  try {
    // Initialize OpenAI with the provided API key
    const openai = new OpenAI({ apiKey });

    // Upload all images to OpenAI
    const fileIds = await Promise.all(
      files.map(async (file) => {
        const uploadedFile = await openai.files.create({
          file: Buffer.from(file.buffer),
          purpose: "assistants",
        });
        return uploadedFile.id;
      })
    );

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread with all the images
    const content = [
      {
        type: "text",
        text: "Please analyze these images and provide a detailed JSON response with your findings. Include any relevant information about objects, people, scenes, text, colors, or other elements in the images.",
      },
      ...files.map((file, index) => ({
        type: "image_file" as const,
        image_file: { file_id: fileIds[index] }
      }))
    ];

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: "Analyze the uploaded images and provide a comprehensive JSON response. Structure your analysis with keys for 'objects', 'scene', 'colors', 'text', and any other relevant attributes. Be detailed but structured.",
      response_format: { type: "json_object" },
    });

    // Poll for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      // Wait for 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === "requires_action") {
        // Handle required actions (not expected in this flow)
        throw new Error("The assistant requires additional input to complete the task");
      }
    }

    if (runStatus.status === "failed") {
      throw new Error(
        runStatus.last_error?.message || 
        "The assistant failed to process the images"
      );
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Find the last assistant message
    const assistantMessages = messages.data.filter(
      msg => msg.role === "assistant"
    );
    
    if (assistantMessages.length === 0) {
      throw new Error("No response received from the assistant");
    }

    // Get the latest assistant message
    const latestMessage = assistantMessages[0];
    
    // Parse JSON from the text content
    let jsonResponse = null;
    
    for (const contentPart of latestMessage.content) {
      if (contentPart.type === "text") {
        try {
          // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
          // We expect it to return proper JSON due to response_format setting
          jsonResponse = JSON.parse(contentPart.text.value);
          break;
        } catch (e) {
          // If there's an error parsing the JSON, use the text content directly
          jsonResponse = { text: contentPart.text.value };
        }
      }
    }

    // Clean up uploaded files
    await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          await openai.files.del(fileId);
        } catch (error) {
          console.error(`Failed to delete file ${fileId}:`, error);
        }
      })
    );

    return {
      data: jsonResponse,
    };
  } catch (error: any) {
    console.error("OpenAI processing error:", error);
    
    return {
      error: error.message || "An error occurred while processing with OpenAI",
    };
  }
}
