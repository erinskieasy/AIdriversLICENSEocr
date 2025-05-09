import { useState } from "react";
import ConfigurationSection from "@/components/configuration-section";
import ImageUploadSection from "@/components/image-upload-section";
import ResponseSection from "@/components/response-section";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ConfigState, FileWithPreview, OpenAIResponse } from "@/lib/types";

export default function Home() {
  const [config, setConfig] = useState<ConfigState>({
    apiKey: "",
    assistantId: "",
  });
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConfigChange = (key: keyof ConfigState, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (newFiles: FileWithPreview[]) => {
    setFiles(newFiles);
  };

  const processImages = async () => {
    if (!config.apiKey || !config.assistantId) {
      toast({
        title: "Missing configuration",
        description: "Please enter your API Key and Assistant ID",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("apiKey", config.apiKey);
      formData.append("assistantId", config.assistantId);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/process-images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      const data: OpenAIResponse = await res.json();
      
      if (data.error) {
        setError(data.error);
        toast({
          title: "Error processing images",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setResponse(data.data);
        toast({
          title: "Success",
          description: "Images processed successfully",
        });
      }
    } catch (err: any) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-secondary mb-2">
          OpenAI Assistant Interface
        </h1>
        <p className="text-gray-500">
          Upload images and process them with your OpenAI Assistant
        </p>
      </header>

      <main>
        <ConfigurationSection 
          config={config} 
          onConfigChange={handleConfigChange} 
        />
        
        <ImageUploadSection 
          files={files}
          onFilesChange={handleFileChange}
          onProcessImages={processImages}
          isProcessing={isLoading}
        />
        
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
