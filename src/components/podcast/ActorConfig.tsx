import { Actor } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUploadZone from "@/components/shared/FileUploadZone";

interface ActorConfigProps {
  actor: Actor;
  index: number;
  onUpdate: (index: number, updates: Partial<Actor>) => void;
}

const ActorConfig = ({ actor, index, onUpdate }: ActorConfigProps) => {
  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      onUpdate(index, { image: files[0], imageUrl: url });
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-lg">Actor {index + 1}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Name</label>
          <input
            type="text"
            value={actor.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
            className="input-dark w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Sex</label>
          <Select value={actor.sex} onValueChange={(v) => onUpdate(index, { sex: v as "male" | "female" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Age</label>
          <Select value={actor.age} onValueChange={(v) => onUpdate(index, { age: v as "young" | "adult" | "senior" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="young">Young</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Shirt Color</label>
          <Select value={actor.color} onValueChange={(v) => onUpdate(index, { color: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hsl(var(--primary))">Purple</SelectItem>
              <SelectItem value="hsl(var(--tool-compress))">Pink</SelectItem>
              <SelectItem value="hsl(var(--tool-resume))">Blue</SelectItem>
              <SelectItem value="hsl(var(--tool-password))">Green</SelectItem>
              <SelectItem value="hsl(var(--tool-convert))">Orange</SelectItem>
              <SelectItem value="hsl(var(--tool-weather))">Yellow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Speech Bubble Text (shown when speaking)</label>
        <input
          type="text"
          value={actor.speechBubble}
          onChange={(e) => onUpdate(index, { speechBubble: e.target.value })}
          className="input-dark w-full"
          placeholder="e.g. Welcome to the show!"
          maxLength={50}
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-2">Profile Picture (optional)</label>
        <FileUploadZone
          accept="image/*"
          maxSize={5}
          onFilesSelected={handleImageUpload}
          label="Upload actor image"
          description="PNG, JPG up to 5MB"
        />
      </div>
    </div>
  );
};

export default ActorConfig;
