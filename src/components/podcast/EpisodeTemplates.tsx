import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutTemplate, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Actor } from "./types";

export interface EpisodeTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  actors: Omit<Actor, "id" | "image" | "imageUrl">[];
  sceneId: string;
  musicPreset: string;
  musicVolume: number;
  isCustom?: boolean;
}

export const EPISODE_TEMPLATES: EpisodeTemplate[] = [
  {
    id: "interview",
    name: "Interview",
    emoji: "🎙️",
    description: "Classic 2-person interview with host and guest",
    actors: [
      { name: "Host", sex: "male", age: "adult", color: "hsl(var(--primary))", speechBubble: "Welcome to the show!", mouthYOffset: 0 },
      { name: "Guest", sex: "female", age: "adult", color: "hsl(var(--tool-compress))", speechBubble: "Thanks for having me!", mouthYOffset: 0 },
    ],
    sceneId: "studio",
    musicPreset: "Calm lo-fi background music for a podcast, soft beats, ambient",
    musicVolume: 15,
  },
  {
    id: "panel",
    name: "Panel Discussion",
    emoji: "👥",
    description: "3-person panel with moderator and panelists",
    actors: [
      { name: "Moderator", sex: "female", age: "adult", color: "hsl(var(--primary))", speechBubble: "Let's discuss...", mouthYOffset: 0 },
      { name: "Panelist A", sex: "male", age: "young", color: "hsl(var(--tool-resume))", speechBubble: "I think...", mouthYOffset: 0 },
      { name: "Panelist B", sex: "female", age: "adult", color: "hsl(var(--tool-convert))", speechBubble: "In my view...", mouthYOffset: 0 },
    ],
    sceneId: "city",
    musicPreset: "Professional news broadcast background music, serious, corporate",
    musicVolume: 10,
  },
  {
    id: "storytelling",
    name: "Storytelling",
    emoji: "📖",
    description: "Solo narrator with cinematic vibes",
    actors: [
      { name: "Narrator", sex: "male", age: "senior", color: "hsl(var(--tool-password))", speechBubble: "Once upon a time...", mouthYOffset: 0 },
    ],
    sceneId: "space",
    musicPreset: "Gentle ambient music for storytelling, emotional, cinematic",
    musicVolume: 25,
  },
  {
    id: "debate",
    name: "Debate",
    emoji: "⚖️",
    description: "Two debaters with opposing views",
    actors: [
      { name: "Side A", sex: "male", age: "adult", color: "hsl(var(--tool-resume))", speechBubble: "I argue that...", mouthYOffset: 0 },
      { name: "Side B", sex: "female", age: "adult", color: "hsl(var(--tool-weather))", speechBubble: "On the contrary...", mouthYOffset: 0 },
    ],
    sceneId: "city",
    musicPreset: "Dramatic orchestral background music for a debate, intense, powerful",
    musicVolume: 12,
  },
  {
    id: "comedy",
    name: "Comedy Show",
    emoji: "😂",
    description: "Fun duo with upbeat energy",
    actors: [
      { name: "Comic 1", sex: "male", age: "young", color: "hsl(var(--tool-convert))", speechBubble: "So get this...", mouthYOffset: 0 },
      { name: "Comic 2", sex: "female", age: "young", color: "hsl(var(--tool-compress))", speechBubble: "No way!", mouthYOffset: 0 },
    ],
    sceneId: "sunset",
    musicPreset: "Upbeat cheerful background music for a talk show, positive vibes",
    musicVolume: 20,
  },
  {
    id: "tech-review",
    name: "Tech Review",
    emoji: "💻",
    description: "Solo tech host reviewing products",
    actors: [
      { name: "Tech Host", sex: "male", age: "young", color: "hsl(var(--tool-compress))", speechBubble: "Let's dive in!", mouthYOffset: 0 },
    ],
    sceneId: "studio",
    musicPreset: "Modern electronic background music for a tech review podcast",
    musicVolume: 15,
  },
];

interface EpisodeTemplatesProps {
  onApplyTemplate: (template: EpisodeTemplate) => void;
  currentActors?: Actor[];
  currentSceneId?: string;
  currentMusicVolume?: number;
}

const EMOJI_OPTIONS = ["🎙️", "🎧", "📻", "🎵", "🎬", "📺", "🎭", "🌟", "💡", "🔥"];

const EpisodeTemplates = ({ onApplyTemplate, currentActors, currentSceneId, currentMusicVolume }: EpisodeTemplatesProps) => {
  const [customTemplates, setCustomTemplates] = useState<EpisodeTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎙️");
  const [isLoading, setIsLoading] = useState(true);

  // Load custom templates from DB
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setCustomTemplates(
            data.map((row: any) => ({
              id: row.id,
              name: row.name,
              description: row.description,
              emoji: row.emoji,
              actors: row.actors as any,
              sceneId: row.scene_id,
              musicPreset: row.music_preset,
              musicVolume: row.music_volume,
              isCustom: true,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const saveCurrentAsTemplate = async () => {
    if (!newName.trim()) {
      toast.error("Enter a template name");
      return;
    }
    if (!currentActors || currentActors.length === 0) {
      toast.error("Configure actors first");
      return;
    }

    setIsSaving(true);
    try {
      const actorsData = currentActors.map(({ id, image, imageUrl, ...rest }) => rest);
      const { data, error } = await supabase
        .from("custom_templates")
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || `Custom template with ${currentActors.length} actor(s)`,
          emoji: newEmoji,
          actors: actorsData as any,
          scene_id: currentSceneId || "default",
          music_preset: "",
          music_volume: currentMusicVolume ?? 20,
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate: EpisodeTemplate = {
        id: data.id,
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        actors: data.actors as any,
        sceneId: data.scene_id,
        musicPreset: data.music_preset,
        musicVolume: data.music_volume,
        isCustom: true,
      };

      setCustomTemplates((prev) => [newTemplate, ...prev]);
      setShowSaveForm(false);
      setNewName("");
      setNewDescription("");
      toast.success("Template saved!");
    } catch (err) {
      console.error("Save template error:", err);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from("custom_templates").delete().eq("id", id);
      if (error) throw error;
      setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } catch (err) {
      console.error("Delete template error:", err);
      toast.error("Failed to delete template");
    }
  };

  const allTemplates = [...EPISODE_TEMPLATES, ...customTemplates];

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" /> Episode Templates
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          <Save className="w-4 h-4 mr-1" /> Save Current
        </Button>
      </div>

      {showSaveForm && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <p className="text-sm font-medium">Save current setup as template</p>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-xl p-1 rounded ${newEmoji === e ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-accent"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name..."
            className="h-8 text-sm"
          />
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Short description (optional)..."
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveCurrentAsTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Save Template
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSaveForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Start with a pre-configured template — actors, background, and music style included. Just upload your audio!
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {allTemplates.map((template) => (
          <div key={template.id} className="relative group">
            <button
              onClick={() => onApplyTemplate(template)}
              className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-center"
            >
              <span className="text-3xl">{template.emoji}</span>
              <span className="text-sm font-medium text-foreground">{template.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{template.description}</span>
              {template.isCustom && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Custom</span>
              )}
            </button>
            {template.isCustom && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeTemplates;
