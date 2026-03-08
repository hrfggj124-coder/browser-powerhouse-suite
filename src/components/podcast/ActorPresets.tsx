import { ActorPreset, ACTOR_PRESETS, Actor } from "./types";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ActorPresetsProps {
  onApplyPreset: (preset: ActorPreset, targetIndex: number) => void;
  actorCount: number;
}

const ActorPresets = ({ onApplyPreset, actorCount }: ActorPresetsProps) => {
  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> Actor Presets
      </h3>
      <p className="text-xs text-muted-foreground">
        Click a preset to apply it to an actor slot. Presets set name, style, age, and a default speech bubble.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {ACTOR_PRESETS.map((preset) => (
          <div key={preset.id} className="space-y-1">
            <button
              onClick={() => onApplyPreset(preset, 0)}
              className="w-full rounded-xl p-3 text-center text-xs font-medium transition-all border border-border/30 hover:border-primary hover:ring-1 hover:ring-primary/30 bg-secondary/40 hover:bg-secondary/70"
            >
              <span className="text-2xl block mb-1">{preset.emoji}</span>
              {preset.name}
            </button>
            {actorCount > 1 && (
              <div className="flex gap-1 justify-center">
                {Array.from({ length: Math.min(actorCount, 6) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => onApplyPreset(preset, i)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
                    title={`Apply to Actor ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActorPresets;
