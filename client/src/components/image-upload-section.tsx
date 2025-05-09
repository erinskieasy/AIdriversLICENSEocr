import { useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileWithPreview } from "@/lib/types";
import { CloudUpload, X, Loader2 } from "lucide-react";

interface ImageUploadSectionProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  onProcessImages: () => void;
  isProcessing: boolean;
}

export default function ImageUploadSection({
  files,
  onFilesChange,
  onProcessImages,
  isProcessing,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileChange = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles: FileWithPreview[] = Array.from(selectedFiles).map((file) => {
        return Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
      });

      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <section className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-4">Upload Images</h2>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 hover:border-primary transition-all cursor-pointer ${
              isDragging ? "border-primary bg-blue-50" : "border-gray-300"
            }`}
            onClick={triggerFileUpload}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
            />
            <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium mb-1">Drag images here or click to upload</h3>
            <p className="text-sm text-gray-500 mb-2">
              Supported formats: JPG, PNG, WebP, HEIC
            </p>
            <Button
              type="button"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileUpload();
              }}
            >
              Select Files
            </Button>
          </div>

          {/* Selected Files Preview */}
          <div className="mb-4">
            {files.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No images selected
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium mb-2">Selected Images:</div>
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center p-2 bg-gray-50 rounded mb-2"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-3">
                      <img
                        src={file.preview}
                        alt={`Preview of ${file.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-error ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="text-right">
            <Button
              type="button"
              onClick={onProcessImages}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Images"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
