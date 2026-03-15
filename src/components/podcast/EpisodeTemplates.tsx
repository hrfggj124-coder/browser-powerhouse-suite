import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";
import { Actor, defaultActors } from "./types";

export interface EpisodeTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  actors: Omit<Actor, "id" | "image" | "imageUrl">[];
  sceneId: string;
  musicPreset: string;
  musicVolume: number;
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
}

const EpisodeTemplates = ({ onApplyTemplate }: EpisodeTemplatesProps) => {
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <LayoutTemplate className="w-5 h-5 text-primary" /> Episode Templates
      </h3>
      <p className="text-xs text-muted-foreground">
        Start with a pre-configured template — actors, background, and music style included. Just upload your audio!
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {EPISODE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onApplyTemplate(template)}
            className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-center"
          >
            <span className="text-3xl">{template.emoji}</span>
            <span className="text-sm font-medium text-foreground">{template.name}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{template.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EpisodeTemplates;
