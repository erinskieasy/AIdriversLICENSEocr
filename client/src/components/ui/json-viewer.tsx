import { useMemo } from "react";

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
}

const JsonViewer = ({ data, expanded = true }: JsonViewerProps) => {
  const displayContent = useMemo(() => {
    // If data is a string, display it directly (for raw response text)
    if (typeof data === 'string') {
      return data;
    }
    
    // Otherwise attempt to format as JSON
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return "Error formatting JSON";
    }
  }, [data]);

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-words">{displayContent}</pre>
  );
};

export default JsonViewer;
