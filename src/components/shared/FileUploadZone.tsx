import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, File, X } from "lucide-react";

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
}

const FileUploadZone = ({
  accept = "*",
  multiple = false,
  onFilesSelected,
  maxSize = 50,
  label = "Drop files here",
  description = "or click to browse",
}: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    },
    [maxSize, multiple, onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
      }
    },
    [maxSize, multiple, onFilesSelected]
  );

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => file.size <= maxSize * 1024 * 1024);
    const filesToAdd = multiple ? validFiles : validFiles.slice(0, 1);
    setFiles(filesToAdd);
    onFilesSelected(filesToAdd);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="space-y-4">
      <label
        className={`upload-zone cursor-pointer block ${isDragOver ? "dragover" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.div
          animate={{ scale: isDragOver ? 1.02 : 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <p className="text-xs text-muted-foreground">Max file size: {maxSize}MB</p>
        </motion.div>
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <File className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
