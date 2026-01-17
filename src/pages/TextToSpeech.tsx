import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Volume2, Play, Pause, Download, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const voices = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm British male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Soft American female" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Confident American male" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Upbeat American female" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Casual Australian male" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Friendly British female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Deep British male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Warm British female" },
];

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(voices[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      return;
    }

    if (text.length > 5000) {
      toast.error("Text must be under 5000 characters");
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast.success("Audio generated successfully!");
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "speech.mp3";
    link.click();
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const selectedVoice = voices.find((v) => v.id === voiceId);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <ToolHeader
          title="Text to Speech"
          description="Convert text to natural-sounding speech with AI voices"
          icon={Volume2}
          color="--tool-tts"
        />

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Voice Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Voice</label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedVoice.description}
                </p>
              )}
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Text</label>
                <span className="text-xs text-muted-foreground">
                  {text.length}/5000 characters
                </span>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="min-h-[200px] resize-none"
                maxLength={5000}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSpeech}
              disabled={isGenerating || !text.trim()}
              className="w-full btn-primary-gradient flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, hsl(var(--tool-tts)) 0%, hsl(280 70% 45%) 100%)",
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  Generate Speech
                </>
              )}
            </button>

            {/* Audio Player */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-secondary/50"
              >
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="p-3 rounded-full bg-tool-tts text-white hover:opacity-90 transition-opacity"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="font-medium">Generated Audio</p>
                    <p className="text-sm text-muted-foreground">
                      Voice: {selectedVoice?.name}
                    </p>
                  </div>
                  <button
                    onClick={downloadAudio}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Download audio"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Privacy Notice */}
            <p className="mt-6 text-xs text-center text-muted-foreground">
              Your text is processed securely. Audio is generated on-demand and not stored.
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TextToSpeech;
