import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageMinus, Download, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface CompressedImage {
  original: File;
  compressed: Blob;
  originalSize: number;
  compressedSize: number;
  preview: string;
}

const ImageCompressor = () => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImages = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setProgress(0);
    const results: CompressedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const options = {
          maxSizeMB: quality / 10,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          onProgress: (p: number) => {
            setProgress(((i + p / 100) / files.length) * 100);
          },
        };

        const compressedFile = await imageCompression(file, options);
        const preview = URL.createObjectURL(compressedFile);

        results.push({
          original: file,
          compressed: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          preview,
        });
      } catch (error) {
        console.error("Compression error:", error);
        toast.error(`Failed to compress ${file.name}`);
      }
    }

    setImages(results);
    setIsProcessing(false);
    setProgress(100);
    if (results.length > 0) {
      toast.success(`Compressed ${results.length} image(s)`);
    }
  }, [quality, maxWidth]);

  const downloadImage = (image: CompressedImage, index: number) => {
    const url = URL.createObjectURL(image.compressed);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compressed_${image.original.name}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    images.forEach((img, i) => downloadImage(img, i));
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const totalSaved = images.reduce(
    (acc, img) => acc + (img.originalSize - img.compressedSize),
    0
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Image Compressor"
          description="Reduce image file sizes while maintaining quality"
          icon={ImageMinus}
          color="--tool-compress"
        />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8 mb-6"
          >
            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Quality</label>
                  <span className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                    {quality}%
                  </span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Max Width</label>
                  <span className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                    {maxWidth}px
                  </span>
                </div>
                <Slider
                  value={[maxWidth]}
                  onValueChange={(value) => setMaxWidth(value[0])}
                  min={320}
                  max={4096}
                  step={64}
                />
              </div>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              accept="image/*"
              multiple
              onFilesSelected={compressImages}
              label="Drop images here"
              description="Supports JPG, PNG, WEBP"
            />

            {/* Progress */}
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Compressing...</span>
                  <span className="text-sm font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
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
                <div>
                  <h3 className="font-semibold">Compressed Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Total saved: {formatSize(totalSaved)}
                  </p>
                </div>
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
                        <span className="line-through">{formatSize(img.originalSize)}</span>
                        <span>→</span>
                        <span className="text-green-500">{formatSize(img.compressedSize)}</span>
                        <span className="text-green-500">
                          (-{Math.round((1 - img.compressedSize / img.originalSize) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadImage(img, index)}
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
      </div>
    </Layout>
  );
};

export default ImageCompressor;
