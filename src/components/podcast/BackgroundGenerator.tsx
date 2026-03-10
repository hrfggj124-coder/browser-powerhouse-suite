import { useState } from "react";
import { Sparkles, Image, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BACKGROUND_SCENES, BackgroundScene } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface BackgroundGeneratorProps {
  selectedScene: string;
  onSelectScene: (sceneId: string) => void;
  onCustomBackground: (imageUrl: string) => void;
}

const AI_PRESETS = [
  { label: "Professional Studio", prompt: "A professional podcast recording studio with warm lighting, acoustic panels, and microphones, dark moody atmosphere" },
  { label: "News Desk", prompt: "A modern TV news studio desk with screens and city skyline backdrop, blue lighting" },
  { label: "Cozy Fireside", prompt: "A cozy living room with a fireplace, bookshelves, warm amber lighting, podcast setup" },
  { label: "Futuristic Neon", prompt: "A futuristic neon-lit cyberpunk studio with holographic displays, purple and cyan colors" },
  { label: "Nature Outdoor", prompt: "A peaceful outdoor podcast setting in a forest clearing with morning light filtering through trees" },
  { label: "Minimalist White", prompt: "A clean minimalist white studio with soft diffused lighting, modern and professional" },
];

const BackgroundGenerator = ({
  selectedScene,
  onSelectScene,
  onCustomBackground,
}: BackgroundGeneratorProps) => {
  const [chatPrompt, setChatPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const generateBackground = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-background", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImages((prev) => [data.imageUrl, ...prev].slice(0, 6));
        onCustomBackground(data.imageUrl);
        toast.success("Background generated!");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Background generation error:", err);
      if (err?.message?.includes("429")) {
        toast.error("Rate limited. Please try again in a moment.");
      } else if (err?.message?.includes("402")) {
        toast.error("AI usage limit reached. Please add credits.");
      } else {
        toast.error("Failed to generate background. Try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    generateBackground(chatPrompt.trim());
    setChatPrompt("");
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" /> Background Scene
      </h3>

      {/* Preset Gradients */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {BACKGROUND_SCENES.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectScene(s.id)}
            className={`rounded-xl p-3 text-center text-xs font-medium transition-all border-2 ${
              selectedScene === s.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-border"
            }`}
            style={{ background: s.gradient, color: "#fff", minHeight: 60 }}
          >
            {s.emoji && <span className="text-lg block">{s.emoji}</span>}
            {s.name}
          </button>
        ))}
      </div>

      {/* AI Quick Presets */}
      <div className="space-y-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> AI-Generated Backgrounds
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AI_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-auto py-2 justify-start"
              onClick={() => generateBackground(preset.prompt)}
              disabled={isGenerating}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* AI Chat Input */}
      <form onSubmit={handleChatSubmit} className="flex gap-2">
        <Input
          value={chatPrompt}
          onChange={(e) => setChatPrompt(e.target.value)}
          placeholder="Describe your ideal background (e.g. 'a rooftop at sunset in Tokyo')..."
          className="flex-1"
          disabled={isGenerating}
        />
        <Button type="submit" size="sm" disabled={isGenerating || !chatPrompt.trim()}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating background with AI...
        </div>
      )}

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Generated backgrounds (click to use):</p>
          <div className="grid grid-cols-3 gap-2">
            {generatedImages.map((url, i) => (
              <button
                key={i}
                onClick={() => onCustomBackground(url)}
                className="rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all aspect-video"
              >
                <img src={url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundGenerator;
