import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Music, Download, Play, Pause, Loader2 } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { toast } from "sonner";

type AudioFormat = "mp3" | "wav";

const AudioExtractor = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>("mp3");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current && ffmpegLoaded) return true;

    setIsLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setFfmpegLoaded(true);
      return true;
    } catch (error) {
      console.error("FFmpeg load error:", error);
      toast.error("Failed to load audio processor");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setVideoFile(files[0]);
      setAudioUrl(null);
      setProgress(0);
    }
  };

  const extractAudio = async () => {
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    const loaded = await loadFFmpeg();
    if (!loaded || !ffmpegRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      const inputFileName = "input" + videoFile.name.substring(videoFile.name.lastIndexOf("."));
      const outputFileName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-vn",
        "-acodec",
        outputFormat === "mp3" ? "libmp3lame" : "pcm_s16le",
        "-q:a",
        "2",
        outputFileName,
      ]);

      const data = await ffmpeg.readFile(outputFileName);
      const dataBuffer = (data as Uint8Array).buffer as ArrayBuffer;
      const blob = new Blob([dataBuffer], { type: `audio/${outputFormat}` });
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
      toast.success("Audio extracted successfully!");
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to extract audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl || !videoFile) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${videoFile.name.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
    link.click();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Audio Extractor"
          description="Extract audio tracks from video files"
          icon={Music}
          color="--tool-audio"
        />

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Format Selection */}
            <div className="mb-8">
              <label className="text-sm text-muted-foreground mb-3 block">
                Output Format
              </label>
              <div className="flex gap-3">
                {(["mp3", "wav"] as AudioFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => setOutputFormat(format)}
                    className={`px-6 py-3 rounded-xl font-medium uppercase transition-all ${
                      outputFormat === format
                        ? "bg-tool-audio text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              accept="video/*"
              onFilesSelected={handleFilesSelected}
              label="Drop a video file here"
              description="Supports MP4, AVI, MOV, MKV, WEBM"
            />

            {/* Loading FFmpeg */}
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading audio processor...
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a moment on first use
                </p>
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Extracting audio...</span>
                  <span className="text-sm font-mono">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Extract Button */}
            {videoFile && !isProcessing && !audioUrl && (
              <button
                onClick={extractAudio}
                disabled={isLoading}
                className="w-full mt-6 btn-primary-gradient flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--tool-audio)) 0%, hsl(173 70% 30%) 100%)",
                }}
              >
                <Music className="w-5 h-5" />
                Extract Audio
              </button>
            )}

            {/* Audio Preview & Download */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-secondary/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Audio Ready!</span>
                  <button
                    onClick={downloadAudio}
                    className="btn-primary-gradient flex items-center gap-2 text-sm"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--tool-audio)) 0%, hsl(173 70% 30%) 100%)",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download {outputFormat.toUpperCase()}
                  </button>
                </div>
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </motion.div>
            )}

            {/* Privacy Note */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              All processing happens locally in your browser using WebAssembly.
              Your video files never leave your device.
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AudioExtractor;
