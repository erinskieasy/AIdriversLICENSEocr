import { useMemo } from "react";

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
}

const JsonViewer = ({ data, expanded = true }: JsonViewerProps) => {
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return "Error formatting JSON";
    }
  }, [data]);

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-words">{formattedJson}</pre>
  );
};

export default JsonViewer;
