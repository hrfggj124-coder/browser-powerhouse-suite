import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Video, Download, Loader2, Settings } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VideoCompressor = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [quality, setQuality] = useState([28]); // CRF value (lower = better quality)
  const [resolution, setResolution] = useState("original");
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileDrop = (files: File[]) => {
    const file = files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setOriginalSize(file.size);
      setCompressedUrl(null);
      setCompressedSize(0);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a video file",
        variant: "destructive",
      });
    }
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();
    
    ffmpeg.on("progress", ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const compressVideo = async () => {
    if (!videoFile) return;

    setIsCompressing(true);
    setProgress(0);

    try {
      const ffmpeg = await loadFFmpeg();
      
      const inputName = "input" + videoFile.name.substring(videoFile.name.lastIndexOf("."));
      const outputName = "output.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Build FFmpeg command based on settings
      const args = ["-i", inputName];

      // Add resolution scaling if not original
      if (resolution !== "original") {
        args.push("-vf", `scale=${resolution}:-2`);
      }

      // Add quality settings (CRF)
      args.push("-crf", quality[0].toString());

      // Use libx264 for wide compatibility
      args.push("-c:v", "libx264");
      args.push("-preset", "medium");
      args.push("-c:a", "aac");
      args.push("-b:a", "128k");
      args.push(outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      
      setCompressedUrl(url);
      setCompressedSize(blob.size);

      toast({
        title: "Compression complete!",
        description: `Reduced from ${formatFileSize(originalSize)} to ${formatFileSize(blob.size)}`,
      });
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: "Compression failed",
        description: "An error occurred during compression",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadVideo = () => {
    if (!compressedUrl || !videoFile) return;
    
    const link = document.createElement("a");
    link.href = compressedUrl;
    link.download = `compressed_${videoFile.name.replace(/\.[^/.]+$/, "")}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressionRatio = compressedSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Video Compressor"
          description="Reduce video file sizes directly in your browser"
          icon={Video}
          color="--tool-compress"
        />

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FileUploadZone
              onFilesSelected={handleFileDrop}
              accept="video/*"
              multiple={false}
              label="Drop your video here"
              description="or click to browse"
            />
          </motion.div>

          {/* Settings */}
          {videoFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Compression Settings</h3>
              </div>

              <div className="space-y-6">
                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Quality</label>
                    <span className="text-sm text-muted-foreground">
                      {quality[0] <= 20 ? "High" : quality[0] <= 28 ? "Medium" : "Low"}
                    </span>
                  </div>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={18}
                    max={35}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>High Quality</span>
                    <span>Smaller File</span>
                  </div>
                </div>

                {/* Resolution Select */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution</label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="1920">1080p (1920px)</SelectItem>
                      <SelectItem value="1280">720p (1280px)</SelectItem>
                      <SelectItem value="854">480p (854px)</SelectItem>
                      <SelectItem value="640">360p (640px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* File Info & Compress Button */}
          {videoFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium truncate max-w-[200px]">{videoFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Original: {formatFileSize(originalSize)}
                  </p>
                </div>
                <button
                  onClick={compressVideo}
                  disabled={isCompressing}
                  className="btn-primary-gradient flex items-center gap-2"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    "Compress Video"
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              {isCompressing && (
                <div className="mt-4">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Processing: {progress}%
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Result */}
          {compressedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-500">
                    Compression Complete!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New size: {formatFileSize(compressedSize)} ({compressionRatio}% smaller)
                  </p>
                </div>
                <button
                  onClick={downloadVideo}
                  className="btn-primary-gradient flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Video Preview */}
              <div className="mt-4">
                <video
                  src={compressedUrl}
                  controls
                  className="w-full rounded-lg max-h-[300px]"
                />
              </div>
            </motion.div>
          )}

          {/* Privacy Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground text-center"
          >
            🔒 Your videos never leave your device. All compression happens locally in your browser.
          </motion.p>
        </div>
      </div>
    </Layout>
  );
};

export default VideoCompressor;
