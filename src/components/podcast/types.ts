export interface Actor {
  id: string;
  name: string;
  sex: "male" | "female";
  age: "young" | "adult" | "senior";
  color: string;
  image: File | null;
  imageUrl: string | null;
  speechBubble: string;
  mouthYOffset: number; // -50 to 50, vertical mouth position adjustment for uploaded images
}

export interface TimelineSegment {
  id: string;
  actorIndex: number;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface ActorPreset {
  id: string;
  name: string;
  emoji: string;
  actor: Omit<Actor, "id" | "image" | "imageUrl">;
}

export interface BackgroundScene {
  id: string;
  name: string;
  gradient: string;
  emoji?: string;
}

export const ACTOR_PRESETS: ActorPreset[] = [
  {
    id: "news-anchor",
    name: "News Anchor",
    emoji: "📰",
    actor: { name: "News Anchor", sex: "male", age: "adult", color: "hsl(var(--tool-resume))", speechBubble: "Breaking news...", mouthYOffset: 0 },
  },
  {
    id: "comedian",
    name: "Comedian",
    emoji: "😂",
    actor: { name: "Comedian", sex: "male", age: "young", color: "hsl(var(--tool-convert))", speechBubble: "So here's the thing...", mouthYOffset: 0 },
  },
  {
    id: "interviewer",
    name: "Interviewer",
    emoji: "🎤",
    actor: { name: "Interviewer", sex: "female", age: "adult", color: "hsl(var(--primary))", speechBubble: "Tell me more...", mouthYOffset: 0 },
  },
  {
    id: "storyteller",
    name: "Storyteller",
    emoji: "📖",
    actor: { name: "Storyteller", sex: "female", age: "senior", color: "hsl(var(--tool-password))", speechBubble: "Once upon a time..." },
  },
  {
    id: "tech-host",
    name: "Tech Host",
    emoji: "💻",
    actor: { name: "Tech Host", sex: "male", age: "young", color: "hsl(var(--tool-compress))", speechBubble: "Let's dive in!" },
  },
  {
    id: "debate",
    name: "Debater",
    emoji: "⚖️",
    actor: { name: "Debater", sex: "female", age: "adult", color: "hsl(var(--tool-weather))", speechBubble: "I disagree because..." },
  },
];

export const BACKGROUND_SCENES: BackgroundScene[] = [
  { id: "studio", name: "Studio", gradient: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
  { id: "sunset", name: "Sunset", gradient: "linear-gradient(180deg, #ff6b6b 0%, #ee5a24 40%, #f0932b 100%)" },
  { id: "nature", name: "Nature", gradient: "linear-gradient(180deg, #2d6a4f 0%, #40916c 50%, #74c69d 100%)" },
  { id: "space", name: "Space", gradient: "linear-gradient(180deg, #0d1b2a 0%, #1b2838 50%, #2a1a4e 100%)", emoji: "✨" },
  { id: "city", name: "City Night", gradient: "linear-gradient(180deg, #141e30 0%, #243b55 50%, #141e30 100%)" },
  { id: "ocean", name: "Ocean", gradient: "linear-gradient(180deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)" },
  { id: "default", name: "Default", gradient: "linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)" },
];

export const defaultActors: Actor[] = [
  { id: "1", name: "Actor 1", sex: "male", age: "adult", color: "hsl(var(--primary))", image: null, imageUrl: null, speechBubble: "", mouthYOffset: 0 },
  { id: "2", name: "Actor 2", sex: "female", age: "adult", color: "hsl(var(--tool-compress))", image: null, imageUrl: null, speechBubble: "", mouthYOffset: 0 },
];

export const AVATAR_SIZE = 200;
export const MOUTH_STATES = { closed: 0, slight: 4, open: 10, wide: 18 };
