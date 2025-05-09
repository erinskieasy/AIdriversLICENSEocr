import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Copy, AlertCircle, Loader2 } from "lucide-react";
import JsonViewer from "@/components/ui/json-viewer";
import { useRef } from "react";

interface ResponseSectionProps {
  response: any;
  isLoading: boolean;
  error: string | null;
  onCopyResponse: () => void;
}

export default function ResponseSection({
  response,
  isLoading,
  error,
  onCopyResponse,
}: ResponseSectionProps) {
  // Reference to the JSON viewer content for direct copying
  const jsonViewerRef = useRef<HTMLPreElement>(null);
  
  // Custom copy handler to copy the extracted JSON directly from the display
  const handleCopy = () => {
    if (jsonViewerRef.current) {
      const displayedContent = jsonViewerRef.current.textContent || "";
      
      navigator.clipboard.writeText(displayedContent)
        .then(() => {
          console.log("[ResponseSection] Copied displayed JSON content");
          // Call the original copy handler for toast notifications
          onCopyResponse();
        })
        .catch(err => {
          console.error("[ResponseSection] Error copying content:", err);
        });
    } else {
      // Fallback to the parent component's copy function
      onCopyResponse();
    }
  };

  return (
    <section>
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Assistant Response</h2>

          {/* Response Display Area */}
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto animate-spin mb-3" />
              <p className="text-gray-500">Processing your request...</p>
            </div>
          ) : error ? (
            <div className="py-6">
              <div className="bg-red-50 border-l-4 border-error p-4 rounded">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-error mr-3" />
                  <div>
                    <p className="font-medium text-error">
                      Error processing your request
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : response ? (
            <div className="bg-gray-50 rounded-md">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="text-sm font-medium">JSON Response</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary hover:text-blue-700"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="p-4 overflow-auto max-h-[400px]">
                <div ref={jsonViewerRef}>
                  <JsonViewer data={response} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Upload images to see the assistant's response
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
