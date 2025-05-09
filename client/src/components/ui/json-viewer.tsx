import { useMemo } from "react";

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
}

const JsonViewer = ({ data, expanded = true }: JsonViewerProps) => {
  const displayContent = useMemo(() => {
    // If data is a string, extract JSON from markdown code blocks or other text
    if (typeof data === 'string') {
      console.log("[JsonViewer] Processing string data:", data.slice(0, 100) + "...");
      
      // Extract JSON from markdown code blocks
      const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const jsonMatch = data.match(jsonCodeBlockRegex);
      
      if (jsonMatch && jsonMatch[1]) {
        console.log("[JsonViewer] JSON code block found, extracting content");
        const extractedJson = jsonMatch[1].trim();
        
        // Try to parse and prettify the JSON
        try {
          const parsedJson = JSON.parse(extractedJson);
          console.log("[JsonViewer] Successfully parsed JSON from code block");
          return JSON.stringify(parsedJson, null, 2);
        } catch (e) {
          console.log("[JsonViewer] Error parsing JSON from code block:", e);
          // Return the extracted content even if it's not valid JSON
          return extractedJson;
        }
      }
      
      // Try to find any JSON-like content with curly braces
      const jsonObjectRegex = /\{[\s\S]*\}/;
      const objectMatch = data.match(jsonObjectRegex);
      
      if (objectMatch) {
        console.log("[JsonViewer] JSON-like object found in text");
        const potentialJson = objectMatch[0];
        
        try {
          const parsedJson = JSON.parse(potentialJson);
          console.log("[JsonViewer] Successfully parsed JSON object");
          return JSON.stringify(parsedJson, null, 2);
        } catch (e) {
          console.log("[JsonViewer] Error parsing potential JSON object:", e);
        }
      }
      
      // If we couldn't extract valid JSON, return the original string
      console.log("[JsonViewer] No valid JSON found, returning original string");
      return data;
    }
    
    // If data is already an object, format it as JSON
    try {
      console.log("[JsonViewer] Formatting object as JSON");
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.log("[JsonViewer] Error formatting JSON:", error);
      return "Error formatting JSON";
    }
  }, [data]);

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-words">{displayContent}</pre>
  );
};

export default JsonViewer;
