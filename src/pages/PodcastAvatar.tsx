import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Play, Pause, Upload, Download, Mic, Square, Circle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Actor {
  id: string;
  name: string;
  sex: "male" | "female";
  age: "young" | "adult" | "senior";
  color: string;
  image: File | null;
  imageUrl: string | null;
}

const defaultActors: Actor[] = [
  { id: "1", name: "Actor 1", sex: "male", age: "adult", color: "hsl(var(--primary))", image: null, imageUrl: null },
  { id: "2", name: "Actor 2", sex: "female", age: "adult", color: "hsl(var(--tool-compress))", image: null, imageUrl: null },
];

const AVATAR_SIZE = 200;
const MOUTH_STATES = { closed: 0, slight: 4, open: 10, wide: 18 };

const PodcastAvatar = () => {
  const [actors, setActors] = useState<Actor[]>(defaultActors);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeActor, setActiveActor] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        setAudioFile(file);
        stream.getTracks().forEach((t) => t.stop());
        toast.success("Recording saved! Press Play & Animate to preview.");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const updateActor = (index: number, updates: Partial<Actor>) => {
    setActors((prev) => prev.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const handleImageUpload = (index: number) => (files: File[]) => {
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      updateActor(index, { image: files[0], imageUrl: url });
    }
  };

  const handleAudioSelected = (files: File[]) => {
    if (files.length > 0) {
      setAudioFile(files[0]);
      toast.success("Audio loaded");
    }
  };

  const drawAvatar = useCallback(
    (canvas: HTMLCanvasElement, actor: Actor, mouthOpenAmount: number, isActive: boolean) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      if (actor.imageUrl) {
        // Draw uploaded image as circular avatar
        const img = new Image();
        img.src = actor.imageUrl;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 70, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - 70, cy - 80, 140, 140);
        ctx.restore();
      } else {
        // Draw simple avatar
        const skinColor = actor.sex === "male" ? "#f0c8a0" : "#f5d5c0";
        const hairColor =
          actor.age === "senior" ? "#ccc" : actor.sex === "male" ? "#4a3728" : "#2c1810";

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 60, 0, Math.PI * 2);
        ctx.fillStyle = skinColor;
        ctx.fill();

        // Hair
        ctx.beginPath();
        if (actor.sex === "male") {
          ctx.arc(cx, cy - 35, 58, Math.PI, Math.PI * 2);
          ctx.fillStyle = hairColor;
          ctx.fill();
        } else {
          ctx.arc(cx, cy - 25, 62, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fillStyle = hairColor;
          ctx.fill();
          // Long hair sides
          ctx.fillRect(cx - 62, cy - 25, 14, 70);
          ctx.fillRect(cx + 48, cy - 25, 14, 70);
        }

        // Eyes
        const eyeY = cy - 20;
        ctx.beginPath();
        ctx.arc(cx - 18, eyeY, 6, 0, Math.PI * 2);
        ctx.arc(cx + 18, eyeY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#333";
        ctx.fill();

        // Eye whites
        ctx.beginPath();
        ctx.arc(cx - 18, eyeY - 1, 2, 0, Math.PI * 2);
        ctx.arc(cx + 18, eyeY - 1, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      // Mouth (always drawn, animated)
      const mouthY = actor.imageUrl ? cy + 50 : cy + 15;
      ctx.beginPath();
      const mouthWidth = 20 + mouthOpenAmount * 0.5;
      const mouthHeight = 2 + mouthOpenAmount;
      ctx.ellipse(cx, mouthY, mouthWidth, Math.max(2, mouthHeight), 0, 0, Math.PI * 2);
      ctx.fillStyle = mouthOpenAmount > 5 ? "#c0392b" : "#e74c3c";
      ctx.fill();

      // Inner mouth for wide open
      if (mouthOpenAmount > 8) {
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mouthWidth * 0.6, mouthHeight * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#7f1d1d";
        ctx.fill();
      }

      // Body/shoulders
      const bodyY = actor.imageUrl ? cy + 75 : cy + 55;
      ctx.beginPath();
      ctx.ellipse(cx, bodyY + 30, 55, 35, 0, Math.PI, Math.PI * 2, true);
      ctx.fillStyle = actor.color;
      ctx.fill();

      // Active speaking indicator
      if (isActive && mouthOpenAmount > 3) {
        ctx.beginPath();
        ctx.arc(cx, cy - 15, 75 + mouthOpenAmount * 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = actor.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Name label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(actor.name, cx, h - 10);
    },
    []
  );

  const animate = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Get average volume
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalized = Math.min(avg / 80, 1);
    const mouthVal = normalized * MOUTH_STATES.wide;
    setMouthOpen(mouthVal);

    // Alternate active actor based on time
    const time = Date.now();
    const actorIdx = Math.floor(time / 4000) % actors.length;
    setActiveActor(actorIdx);

    // Draw avatars
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) {
        const isActive = i === actorIdx;
        const mouth = isActive ? mouthVal : Math.max(0, mouthVal * 0.1);
        drawAvatar(canvas, actors[i], mouth, isActive);
      }
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [actors, drawAvatar]);

  const playAudio = async () => {
    if (!audioFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    try {
      const audioCtx = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      analyserRef.current = analyser;

      const audio = new Audio(URL.createObjectURL(audioFile));
      audioRef.current = audio;

      source.start();
      setIsPlaying(true);
      animate();

      source.onended = () => {
        setIsPlaying(false);
        cancelAnimationFrame(animFrameRef.current);
        setMouthOpen(0);
        // Redraw with closed mouths
        canvasRefs.current.forEach((canvas, i) => {
          if (canvas) drawAvatar(canvas, actors[i], 0, false);
        });
      };
    } catch (err) {
      toast.error("Failed to play audio");
      console.error(err);
    }
  };

  // Initial draw
  useEffect(() => {
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) drawAvatar(canvas, actors[i], 0, false);
    });
  }, [actors, drawAvatar]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ToolHeader
          title="Podcast Avatar"
          description="Create animated talking avatars for podcasts. Upload audio and images, select actor types, and watch them lip-sync."
          icon={Users}
          color="--tool-podcast"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Actor Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actors.map((actor, index) => (
              <div key={actor.id} className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-lg">Actor {index + 1}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Name</label>
                    <input
                      type="text"
                      value={actor.name}
                      onChange={(e) => updateActor(index, { name: e.target.value })}
                      className="input-dark w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Sex</label>
                    <Select
                      value={actor.sex}
                      onValueChange={(v) => updateActor(index, { sex: v as "male" | "female" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Age</label>
                    <Select
                      value={actor.age}
                      onValueChange={(v) => updateActor(index, { age: v as "young" | "adult" | "senior" })}
                    >
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
                    <Select
                      value={actor.color}
                      onValueChange={(v) => updateActor(index, { color: v })}
                    >
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

                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Profile Picture (optional)
                  </label>
                  <FileUploadZone
                    accept="image/*"
                    maxSize={5}
                    onFilesSelected={handleImageUpload(index)}
                    label="Upload actor image"
                    description="PNG, JPG up to 5MB"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Audio Upload */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Podcast Audio
            </h3>
            <FileUploadZone
              accept="audio/*"
              maxSize={50}
              onFilesSelected={handleAudioSelected}
              label="Upload podcast audio"
              description="MP3, WAV, M4A up to 50MB"
            />
            {audioFile && (
              <p className="text-sm text-muted-foreground">
                Loaded: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          {/* Preview Stage */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Preview Stage</h3>
              <Button
                onClick={playAudio}
                className={isPlaying ? "bg-destructive hover:bg-destructive/80" : "btn-primary-gradient"}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> Play & Animate
                  </>
                )}
              </Button>
            </div>

            <div
              className="rounded-2xl p-8 flex items-center justify-center gap-8 md:gap-16"
              style={{
                background: "linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)",
                minHeight: 300,
              }}
            >
              {actors.map((actor, i) => (
                <div key={actor.id} className="flex flex-col items-center">
                  <canvas
                    ref={(el) => { canvasRefs.current[i] = el; }}
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE + 40}
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Avatars animate mouth movements based on audio waveform analysis. All processing happens locally.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PodcastAvatar;
