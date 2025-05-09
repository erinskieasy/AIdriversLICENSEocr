
import { useState, useEffect } from "react";
import ConfigurationSection from "@/components/configuration-section";
import ImageUploadSection from "@/components/image-upload-section";
import ResponseSection from "@/components/response-section";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ConfigState, FileWithPreview, OpenAIResponse } from "@/lib/types";

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  if (data) {
    console.log(`[Client] ${message}`, data);
  } else {
    console.log(`[Client] ${message}`);
  }
};

export default function Home() {
  // State management for configuration (API key and Assistant ID)
  const [config, setConfig] = useState<ConfigState>({
    apiKey: "",
    assistantId: "",
  });

  // State for managing uploaded image files with preview URLs
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  
  // State for storing OpenAI's response
  const [response, setResponse] = useState<any>(null);
  
  // Loading state during API requests
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state for handling API errors
  const [error, setError] = useState<string | null>(null);
  
  // Toast notifications hook for user feedback
  const { toast } = useToast();

  // Log component mount
  useEffect(() => {
    log("Home component mounted");
    
    return () => {
      log("Home component unmounted");
    };
  }, []);

  // Handler for updating configuration values (API key or Assistant ID)
  const handleConfigChange = (key: keyof ConfigState, value: string) => {
    log(`Config changed: ${key}`, key === 'apiKey' ? '(masked)' : value);
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Handler for updating the list of uploaded files
  const handleFileChange = (newFiles: FileWithPreview[]) => {
    log(`Files changed, new count: ${newFiles.length}`);
    if (newFiles.length > 0) {
      log("Files information:", newFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })));
    }
    setFiles(newFiles);
  };

  // Main function to process images with OpenAI
  const processImages = async () => {
    log("Process images started");
    
    // Validate configuration
    if (!config.apiKey || !config.assistantId) {
      log("Missing configuration, showing error toast");
      toast({
        title: "Missing configuration",
        description: "Please enter your API Key and Assistant ID",
        variant: "destructive",
      });
      return;
    }

    // Validate file uploads
    if (files.length === 0) {
      log("No files selected, showing error toast");
      toast({
        title: "No files selected",
        description: "Please select at least one image file",
        variant: "destructive",
      });
      return;
    }

    log(`Starting request with ${files.length} files and assistant ID: ${config.assistantId}`);
    
    // Reset states before processing
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Create FormData to send files and configuration
      log("Creating FormData object");
      const formData = new FormData();
      formData.append("apiKey", config.apiKey);
      formData.append("assistantId", config.assistantId);
      
      // Append all selected files to FormData
      log(`Appending ${files.length} files to FormData`);
      files.forEach((file, index) => {
        log(`Adding file ${index + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
        formData.append("files", file);
      });

      // Send POST request to backend API
      log("Sending fetch request to /api/process-images");
      const res = await fetch("/api/process-images", {
        method: "POST",
        body: formData,
      });

      log(`Response received with status: ${res.status} ${res.statusText}`);
      
      // Handle non-200 responses
      if (!res.ok) {
        const errorText = await res.text();
        log(`Error response: ${errorText || res.statusText}`);
        throw new Error(errorText || res.statusText);
      }

      // Parse response data
      log("Parsing JSON response");
      const data: OpenAIResponse = await res.json();
      log("Response parsed successfully", { hasError: !!data.error, hasData: !!data.data });
      
      // Handle API-level errors
      if (data.error) {
        log(`Error in response: ${data.error}`);
        setError(data.error);
        toast({
          title: "Error processing images",
          description: data.error,
          variant: "destructive",
        });
      } else {
        // Store successful response
        log("Success response received", { 
          dataType: typeof data.data,
          responseLength: typeof data.data === 'string' ? data.data.length : 'unknown'
        });
        // Pass the raw response directly to be displayed
        setResponse(data.data);
        toast({
          title: "Success",
          description: "Images processed successfully",
        });
      }
    } catch (err: any) {
      // Handle any other errors
      log(`Error caught: ${err.message}`, err);
      setError(err.message);
      toast({
        title: "Error processing images",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      log("Request completed, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Helper function to copy response to clipboard
  const copyResponseToClipboard = () => {
    log("Copying response to clipboard");
    if (response) {
      // Handle both string and object types
      const textToCopy = typeof response === 'string' 
        ? response 
        : JSON.stringify(response, null, 2);
        
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          log("Response copied to clipboard successfully");
          toast({
            title: "Copied to clipboard",
            description: "Response copied to clipboard",
          });
        })
        .catch(err => {
          log(`Error copying to clipboard: ${err.message}`);
          toast({
            title: "Error",
            description: "Failed to copy to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  // Render the UI components
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header section with title and description */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-secondary mb-2">
          OpenAI Assistant Interface
        </h1>
        <p className="text-gray-500">
          Upload images and process them with your OpenAI Assistant
        </p>
      </header>

      <main>
        {/* Configuration section for API key and Assistant ID */}
        <ConfigurationSection 
          config={config} 
          onConfigChange={handleConfigChange} 
        />
        
        {/* Image upload section with drag & drop and file list */}
        <ImageUploadSection 
          files={files}
          onFilesChange={handleFileChange}
          onProcessImages={processImages}
          isProcessing={isLoading}
        />
        
        {/* Response section showing OpenAI's analysis */}
        <ResponseSection 
          response={response}
          isLoading={isLoading}
          error={error}
          onCopyResponse={copyResponseToClipboard}
        />
      </main>
    </div>
  );
}
