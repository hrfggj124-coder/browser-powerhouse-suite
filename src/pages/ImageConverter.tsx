import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Download, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { toast } from "sonner";

type OutputFormat = "png" | "jpeg" | "webp";

interface ConvertedImage {
  original: File;
  converted: Blob;
  format: OutputFormat;
  preview: string;
}

const ImageConverter = () => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(0.9);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const convertImage = useCallback(
    async (file: File): Promise<ConvertedImage | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(null);
              return;
            }

            // Fill background for JPEG (no transparency)
            if (outputFormat === "jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const preview = URL.createObjectURL(blob);
                  resolve({
                    original: file,
                    converted: blob,
                    format: outputFormat,
                    preview,
                  });
                } else {
                  resolve(null);
                }
              },
              `image/${outputFormat}`,
              outputFormat === "png" ? undefined : quality
            );
          };

          img.src = e.target?.result as string;
        };

        reader.readAsDataURL(file);
      });
    },
    [outputFormat, quality]
  );

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);
      const results: ConvertedImage[] = [];

      for (const file of files) {
        const result = await convertImage(file);
        if (result) {
          results.push(result);
        } else {
          toast.error(`Failed to convert ${file.name}`);
        }
      }

      setImages(results);
      setIsProcessing(false);

      if (results.length > 0) {
        toast.success(`Converted ${results.length} image(s) to ${outputFormat.toUpperCase()}`);
      }
    },
    [convertImage, outputFormat]
  );

  const downloadImage = (image: ConvertedImage) => {
    const url = URL.createObjectURL(image.converted);
    const link = document.createElement("a");
    const baseName = image.original.name.replace(/\.[^/.]+$/, "");
    link.href = url;
    link.download = `${baseName}.${image.format === "jpeg" ? "jpg" : image.format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    images.forEach((img) => downloadImage(img));
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const formats: { value: OutputFormat; label: string }[] = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPG" },
    { value: "webp", label: "WEBP" },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Image Converter"
          description="Convert images between PNG, JPG, and WEBP formats"
          icon={ImageIcon}
          color="--tool-convert"
        />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8 mb-6"
          >
            {/* Format Selection */}
            <div className="mb-8">
              <label className="text-sm text-muted-foreground mb-3 block">
                Output Format
              </label>
              <div className="flex flex-wrap gap-3">
                {formats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setOutputFormat(format.value)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      outputFormat === format.value
                        ? "bg-tool-convert text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              accept="image/*"
              multiple
              onFilesSelected={handleFilesSelected}
              label="Drop images here"
              description="Supports JPG, PNG, WEBP, GIF"
            />

            {isProcessing && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Converting...
                </div>
              </div>
            )}
          </motion.div>

          {/* Results */}
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Converted Images</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadAll}
                    className="btn-primary-gradient flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download All
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-3 rounded-xl bg-secondary hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                  >
                    <img
                      src={img.preview}
                      alt={img.original.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{img.original.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatSize(img.original.size)}</span>
                        <span>→</span>
                        <span className="text-tool-convert">
                          {img.format.toUpperCase()} ({formatSize(img.converted.size)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadImage(img)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
};

export default ImageConverter;
