import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Upload, Loader2, Copy, Download, FileAudio } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriberRef = useRef<any>(null);

  const loadModel = async () => {
    if (transcriberRef.current) return transcriberRef.current;
    
    setLoadingModel(true);
    setProgress(0);
    
    try {
      const { pipeline } = await import("@huggingface/transformers");
      
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.en",
        {
          device: "webgpu",
          progress_callback: (data: any) => {
            if (data.status === "progress" && data.progress) {
              setProgress(Math.round(data.progress));
            }
          },
        }
      );
      
      transcriberRef.current = transcriber;
      setModelLoaded(true);
      toast.success("AI model loaded successfully!");
      return transcriber;
    } catch (error) {
      console.error("Failed to load model:", error);
      // Fallback to CPU if WebGPU not available
      try {
        const { pipeline } = await import("@huggingface/transformers");
        const transcriber = await pipeline(
          "automatic-speech-recognition",
          "onnx-community/whisper-tiny.en"
        );
        transcriberRef.current = transcriber;
        setModelLoaded(true);
        toast.success("AI model loaded (CPU mode)");
        return transcriber;
      } catch (fallbackError) {
        toast.error("Failed to load AI model");
        throw fallbackError;
      }
    } finally {
      setLoadingModel(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setProgress(0);
    
    try {
      const transcriber = await loadModel();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio data as Float32Array
      const audioData = audioBuffer.getChannelData(0);
      
      setProgress(50);
      
      const result = await transcriber(audioData);
      
      setProgress(100);
      setTranscript(result.text || "");
      toast.success("Transcription complete!");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Processing recording...");
    }
  };

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setAudioFile(file);
      await transcribeAudio(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    toast.success("Copied to clipboard!");
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transcript.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Speech to Text"
          description="Transcribe audio files or record from your microphone"
          icon={FileAudio}
          color="--tool-stt"
        />

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Model Loading */}
            {!modelLoaded && !loadingModel && (
              <div className="mb-6 p-4 rounded-xl bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  AI model will be loaded when you start transcribing (first time may take a moment)
                </p>
                <button
                  onClick={loadModel}
                  className="text-sm text-primary hover:underline"
                >
                  Pre-load model now
                </button>
              </div>
            )}

            {loadingModel && (
              <div className="mb-6 p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="font-medium">Loading AI model...</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This only happens once per session
                </p>
              </div>
            )}

            {/* Recording Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Record Audio</h3>
              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing || loadingModel}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-destructive animate-pulse"
                      : "bg-tool-stt hover:opacity-90"
                  } text-white disabled:opacity-50`}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {isRecording ? "Click to stop recording" : "Click to start recording"}
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-card text-sm text-muted-foreground">or</span>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Upload Audio File</h3>
              <FileUploadZone
                accept="audio/*"
                onFilesSelected={handleFileSelected}
                label="Drop an audio file here"
                description="MP3, WAV, M4A, WebM supported"
              />
              {audioFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {audioFile.name}
                </p>
              )}
            </div>

            {/* Progress */}
            {isTranscribing && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcribing...
                  </span>
                  <span className="text-sm font-mono">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Transcript Output */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Transcript</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadTranscript}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      title="Download transcript"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[150px] resize-none"
                  placeholder="Transcription will appear here..."
                />
              </motion.div>
            )}

            {/* Privacy Notice */}
            <p className="mt-6 text-xs text-center text-muted-foreground">
              🔒 Your audio is processed locally in your browser. Nothing is uploaded to any server.
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SpeechToText;
