
import { useState } from "react";
import ConfigurationSection from "@/components/configuration-section";
import ImageUploadSection from "@/components/image-upload-section";
import ResponseSection from "@/components/response-section";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ConfigState, FileWithPreview, OpenAIResponse } from "@/lib/types";

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

  // Handler for updating configuration values (API key or Assistant ID)
  const handleConfigChange = (key: keyof ConfigState, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Handler for updating the list of uploaded files
  const handleFileChange = (newFiles: FileWithPreview[]) => {
    setFiles(newFiles);
  };

  // Main function to process images with OpenAI
  const processImages = async () => {
    // Validate configuration
    if (!config.apiKey || !config.assistantId) {
      toast({
        title: "Missing configuration",
        description: "Please enter your API Key and Assistant ID",
        variant: "destructive",
      });
      return;
    }

    // Validate file uploads
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image file",
        variant: "destructive",
      });
      return;
    }

    // Reset states before processing
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Create FormData to send files and configuration
      const formData = new FormData();
      formData.append("apiKey", config.apiKey);
      formData.append("assistantId", config.assistantId);
      
      // Append all selected files to FormData
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Send POST request to backend API
      const res = await fetch("/api/process-images", {
        method: "POST",
        body: formData,
      });

      // Handle non-200 responses
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      // Parse response data
      const data: OpenAIResponse = await res.json();
      
      // Handle API-level errors
      if (data.error) {
        setError(data.error);
        toast({
          title: "Error processing images",
          description: data.error,
          variant: "destructive",
        });
      } else {
        // Store successful response
        setResponse(data.data);
        toast({
          title: "Success",
          description: "Images processed successfully",
        });
      }
    } catch (err: any) {
      // Handle any other errors
      setError(err.message);
      toast({
        title: "Error processing images",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to copy response JSON to clipboard
  const copyResponseToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2)).then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Response copied to clipboard",
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
