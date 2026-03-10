import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Play, Pause, Mic, Square, Circle, Download, Music, Plus, Trash2, GripVertical, Save, FolderOpen } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import ActorConfig from "@/components/podcast/ActorConfig";
import AudioWaveform from "@/components/podcast/AudioWaveform";
import TimelineEditor from "@/components/podcast/TimelineEditor";
import ActorPresets from "@/components/podcast/ActorPresets";
import BackgroundGenerator from "@/components/podcast/BackgroundGenerator";
import { drawAvatar } from "@/components/podcast/drawAvatar";
import { smartAutoFill } from "@/components/podcast/audioAnalysis";
import {
  Actor, ActorPreset, TimelineSegment, BACKGROUND_SCENES, defaultActors, AVATAR_SIZE, MOUTH_STATES,
} from "@/components/podcast/types";

const PodcastAvatar = () => {
  const [actors, setActors] = useState<Actor[]>(defaultActors);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeActor, setActiveActor] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [selectedScene, setSelectedScene] = useState("default");
  const [showWaveform, setShowWaveform] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);

  const updateActor = (index: number, updates: Partial<Actor>) => {
    setActors((prev) => prev.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const addActor = () => {
    if (actors.length >= 6) {
      toast.error("Maximum 6 actors allowed");
      return;
    }
    const id = String(Date.now());
    const colors = [
      "hsl(var(--primary))", "hsl(var(--tool-compress))", "hsl(var(--tool-resume))",
      "hsl(var(--tool-password))", "hsl(var(--tool-convert))", "hsl(var(--tool-weather))",
    ];
    setActors((prev) => [
      ...prev,
      {
        id,
        name: `Actor ${prev.length + 1}`,
        sex: prev.length % 2 === 0 ? "male" : "female",
        age: "adult",
        color: colors[prev.length % colors.length],
        image: null,
        imageUrl: null,
        speechBubble: "",
      },
    ]);
  };

  const removeActor = (index: number) => {
    if (actors.length <= 1) {
      toast.error("Need at least 1 actor");
      return;
    }
    setActors((prev) => prev.filter((_, i) => i !== index));
  };

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
        toast.success("Recording saved!");
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

  const generateWaveformPeaks = async (file: File, numBars = 200) => {
    try {
      const ctx = new OfflineAudioContext(1, 1, 44100);
      const arrayBuf = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuf);
      const data = audioBuffer.getChannelData(0);
      const step = Math.floor(data.length / numBars);
      const peaks: number[] = [];
      for (let i = 0; i < numBars; i++) {
        let max = 0;
        for (let j = i * step; j < (i + 1) * step && j < data.length; j++) {
          const abs = Math.abs(data[j]);
          if (abs > max) max = abs;
        }
        peaks.push(max);
      }
      // Normalize
      const peakMax = Math.max(...peaks, 0.01);
      setWaveformPeaks(peaks.map((p) => p / peakMax));
    } catch {
      setWaveformPeaks([]);
    }
  };

  const handleAudioSelected = (files: File[]) => {
    if (files.length > 0) {
      setAudioFile(files[0]);
      generateWaveformPeaks(files[0]);
      // Detect duration
      const tempAudio = new Audio(URL.createObjectURL(files[0]));
      tempAudio.addEventListener("loadedmetadata", () => {
        if (isFinite(tempAudio.duration)) {
          setAudioDuration(tempAudio.duration);
        }
      });
      toast.success("Audio loaded");
    }
  };

  const handleMusicSelected = (files: File[]) => {
    if (files.length > 0) {
      setMusicFile(files[0]);
      toast.success("Background music loaded");
    }
  };

  const scene = BACKGROUND_SCENES.find((s) => s.id === selectedScene) || BACKGROUND_SCENES[6];
  const stageBackground = customBackgroundUrl
    ? `url(${customBackgroundUrl}) center/cover no-repeat`
    : scene.gradient;

  const getActiveActorAtTime = useCallback((elapsedSec: number): number => {
    if (timelineSegments.length > 0) {
      const seg = timelineSegments.find(
        (s) => elapsedSec >= s.startTime && elapsedSec < s.endTime
      );
      if (seg) return seg.actorIndex % actors.length;
    }
    // Fallback: auto-alternate every 4 seconds
    return Math.floor(elapsedSec / 4) % actors.length;
  }, [timelineSegments, actors.length]);

  const animate = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalized = Math.min(avg / 80, 1);
    const mouthVal = normalized * MOUTH_STATES.wide;
    setMouthOpen(mouthVal);

    const elapsed = (Date.now() - playStartTimeRef.current) / 1000;
    setCurrentTime(elapsed);
    const actorIdx = getActiveActorAtTime(elapsed);
    setActiveActor(actorIdx);

    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) {
        const isActive = i === actorIdx;
        const mouth = isActive ? mouthVal : Math.max(0, mouthVal * 0.1);
        drawAvatar(canvas, actors[i], mouth, isActive);
      }
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [actors, getActiveActorAtTime]);

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    cancelAnimationFrame(animFrameRef.current);
    setMouthOpen(0);
    try { musicSourceRef.current?.stop(); } catch { /* already stopped */ }
    try { audioCtxRef.current?.close(); } catch { /* ok */ }
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas && actors[i]) drawAvatar(canvas, actors[i], 0, false);
    });
  };

  const playAudio = async () => {
    if (!audioFile) {
      toast.error("Please upload or record audio first");
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;

      // Background music
      if (musicFile) {
        const musicBuffer = await musicFile.arrayBuffer();
        const musicAudioBuffer = await audioCtx.decodeAudioData(musicBuffer);
        const musicSource = audioCtx.createBufferSource();
        musicSource.buffer = musicAudioBuffer;
        musicSource.loop = true;
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = musicVolume / 100;
        musicSource.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        musicSource.start();
        musicSourceRef.current = musicSource;
        musicGainRef.current = gainNode;
      }

      source.start();
      playStartTimeRef.current = Date.now();
      setCurrentTime(0);
      setIsPlaying(true);
      animate();

      source.onended = () => {
        stopPlayback();
      };
    } catch (err) {
      toast.error("Failed to play audio");
      console.error(err);
    }
  };

  // Update music volume live
  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = musicVolume / 100;
    }
  }, [musicVolume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        playAudio();
      } else if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isRecording) stopRecording();
        else startRecording();
      } else if (e.code === "KeyE" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exportVideo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying, isRecording, audioFile, isExporting]);

  // Export as video using canvas capture
  const exportVideo = async () => {
    if (!audioFile) {
      toast.error("Upload audio first to export");
      return;
    }

    setIsExporting(true);
    toast.info("Exporting video... This may take a moment.");

    try {
      // Create an offscreen canvas for compositing
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 640;
      exportCanvas.height = 360;
      const ctx = exportCanvas.getContext("2d")!;

      const stream = exportCanvas.captureStream(30);

      // Add audio to the stream
      const audioCtx = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      const dest = audioCtx.createMediaStreamDestination();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(dest);
      analyser.connect(audioCtx.destination);

      // Music track
      let musicSource2: AudioBufferSourceNode | null = null;
      if (musicFile) {
        const mb = await musicFile.arrayBuffer();
        const mab = await audioCtx.decodeAudioData(mb);
        musicSource2 = audioCtx.createBufferSource();
        musicSource2.buffer = mab;
        musicSource2.loop = true;
        const g = audioCtx.createGain();
        g.gain.value = musicVolume / 100;
        musicSource2.connect(g);
        g.connect(dest);
      }

      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "podcast-avatar.webm";
        a.click();
        URL.revokeObjectURL(url);
        audioCtx.close();
        setIsExporting(false);
        toast.success("Video exported!");
      };

      // Animation loop for export
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let running = true;
      const exportStartTime = Date.now();

      const drawFrame = () => {
        if (!running) return;

        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(avg / 80, 1);
        const mouthVal = normalized * MOUTH_STATES.wide;
        const elapsed = (Date.now() - exportStartTime) / 1000;
        const actorIdx = getActiveActorAtTime(elapsed);

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(1, "#0f0f1a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Draw each actor onto export canvas
        const spacing = exportCanvas.width / (actors.length + 1);
        actors.forEach((actor, i) => {
          const tmpCanvas = document.createElement("canvas");
          tmpCanvas.width = AVATAR_SIZE;
          tmpCanvas.height = AVATAR_SIZE + 40;
          const isActive = i === actorIdx;
          const mouth = isActive ? mouthVal : Math.max(0, mouthVal * 0.1);
          drawAvatar(tmpCanvas, actor, mouth, isActive);
          const x = spacing * (i + 1) - AVATAR_SIZE / 2;
          const y = (exportCanvas.height - AVATAR_SIZE - 40) / 2;
          ctx.drawImage(tmpCanvas, x, y);
        });

        // Waveform bar at bottom
        const barWidth = exportCanvas.width / 64;
        for (let i = 0; i < 64; i++) {
          const barHeight = (dataArray[i * Math.floor(dataArray.length / 64)] / 255) * 40;
          ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
          ctx.fillRect(i * barWidth, exportCanvas.height - barHeight, barWidth - 1, barHeight);
        }

        requestAnimationFrame(drawFrame);
      };

      recorder.start();
      source.start();
      musicSource2?.start();
      drawFrame();

      source.onended = () => {
        running = false;
        try { musicSource2?.stop(); } catch { /* ok */ }
        setTimeout(() => recorder.stop(), 200);
      };
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
      setIsExporting(false);
    }
  };

  // Download combined audio (voice + music)
  const downloadAudio = async () => {
    if (!audioFile) {
      toast.error("No audio to download");
      return;
    }

    if (!musicFile) {
      // Just download the voice
      const url = URL.createObjectURL(audioFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = audioFile.name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audio downloaded");
      return;
    }

    toast.info("Mixing audio...");
    try {
      const audioCtx = new OfflineAudioContext(2, 44100 * 300, 44100);
      const voiceBuf = await audioCtx.decodeAudioData(await audioFile.arrayBuffer());
      const musicBuf = await audioCtx.decodeAudioData(await musicFile.arrayBuffer());

      const voiceSrc = audioCtx.createBufferSource();
      voiceSrc.buffer = voiceBuf;
      voiceSrc.connect(audioCtx.destination);

      const musicSrc = audioCtx.createBufferSource();
      musicSrc.buffer = musicBuf;
      const gain = audioCtx.createGain();
      gain.gain.value = musicVolume / 100;
      musicSrc.connect(gain);
      gain.connect(audioCtx.destination);

      voiceSrc.start();
      musicSrc.start();

      // Render only the duration of the voice
      const offline = new OfflineAudioContext(2, voiceBuf.length, voiceBuf.sampleRate);
      const v2 = offline.createBufferSource();
      v2.buffer = voiceBuf;
      v2.connect(offline.destination);
      const m2 = offline.createBufferSource();
      m2.buffer = musicBuf;
      const g2 = offline.createGain();
      g2.gain.value = musicVolume / 100;
      m2.connect(g2);
      g2.connect(offline.destination);
      v2.start();
      m2.start();

      const rendered = await offline.startRendering();

      // Convert to WAV
      const wavBlob = audioBufferToWav(rendered);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "podcast-mixed.wav";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Mixed audio downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mix audio");
    }
  };

  const applyPreset = (preset: ActorPreset, targetIndex: number) => {
    if (targetIndex >= actors.length) return;
    updateActor(targetIndex, {
      name: preset.actor.name,
      sex: preset.actor.sex,
      age: preset.actor.age,
      color: preset.actor.color,
      speechBubble: preset.actor.speechBubble,
    });
    toast.success(`Applied "${preset.name}" to Actor ${targetIndex + 1}`);
  };

  // Export project as JSON
  const exportProject = () => {
    const project = {
      version: 1,
      actors: actors.map(({ image, imageUrl, ...rest }) => rest),
      timelineSegments,
      selectedScene,
      musicVolume,
      showWaveform,
      audioDuration,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "podcast-project.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project exported");
  };

  // Import project from JSON
  const importProject = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project = JSON.parse(text);
        if (!project.version || !project.actors) {
          toast.error("Invalid project file");
          return;
        }
        setActors(
          project.actors.map((a: any) => ({
            ...a,
            image: null,
            imageUrl: null,
          }))
        );
        if (project.timelineSegments) setTimelineSegments(project.timelineSegments);
        if (project.selectedScene) setSelectedScene(project.selectedScene);
        if (project.musicVolume !== undefined) setMusicVolume(project.musicVolume);
        if (project.showWaveform !== undefined) setShowWaveform(project.showWaveform);
        if (project.audioDuration) setAudioDuration(project.audioDuration);
        toast.success("Project imported! Re-upload audio/music files to continue.");
      } catch {
        toast.error("Failed to parse project file");
      }
    };
    input.click();
  };

  // Initial draw
  useEffect(() => {
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) drawAvatar(canvas, actors[i], 0, false);
    });
  }, [actors]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ToolHeader
          title="Podcast Avatar"
          description="Create animated talking avatars for podcasts with background music, waveforms, and video export."
          icon={Users}
          color="--tool-podcast"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Actor Configuration */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-lg">Actors ({actors.length}/6)</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={importProject}>
                <FolderOpen className="w-4 h-4 mr-1" /> Import Project
              </Button>
              <Button variant="outline" size="sm" onClick={exportProject}>
                <Save className="w-4 h-4 mr-1" /> Export Project
              </Button>
              <Button variant="outline" size="sm" onClick={addActor} disabled={actors.length >= 6}>
                <Plus className="w-4 h-4 mr-1" /> Add Actor
              </Button>
            </div>
          </div>
          <div className={`grid gap-6 ${actors.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {actors.map((actor, index) => (
              <div
                key={actor.id}
                className={`relative transition-all ${
                  dragIndex === index ? "opacity-50 scale-95" : ""
                } ${dragOverIndex === index ? "ring-2 ring-primary rounded-xl" : ""}`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    setActors((prev) => {
                      const updated = [...prev];
                      const [moved] = updated.splice(dragIndex, 1);
                      updated.splice(index, 0, moved);
                      return updated;
                    });
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
              >
                <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>
                {actors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActor(index)}
                    className="absolute top-2 right-2 z-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <ActorConfig actor={actor} index={index} onUpdate={updateActor} />
              </div>
            ))}
          </div>

          {/* Actor Presets */}
          <ActorPresets onApplyPreset={applyPreset} actorCount={actors.length} />

          {/* Speaker Timeline */}
          <TimelineEditor
            actors={actors}
            segments={timelineSegments}
            onSegmentsChange={setTimelineSegments}
            audioDuration={audioDuration}
            currentTime={currentTime}
            isPlaying={isPlaying}
            waveformPeaks={waveformPeaks}
            onSeek={(time) => {
              if (!isPlaying) {
                setCurrentTime(time);
              }
            }}
          />


          <BackgroundGenerator
            selectedScene={selectedScene}
            onSelectScene={(id) => {
              setSelectedScene(id);
              setCustomBackgroundUrl(null);
            }}
            onCustomBackground={(url) => {
              setCustomBackgroundUrl(url);
              setSelectedScene(""); // deselect presets
            }}
          />

          {/* Audio Upload & Music */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" /> Podcast Audio
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <><Square className="w-4 h-4" /> Stop Recording</>
                  ) : (
                    <><Circle className="w-4 h-4 text-destructive" /> Record Audio</>
                  )}
                </Button>
                {isRecording && (
                  <span className="flex items-center gap-2 text-sm text-destructive animate-pulse">
                    <Circle className="w-3 h-3 fill-current" /> Recording...
                  </span>
                )}
              </div>
              <FileUploadZone
                accept="audio/*"
                maxSize={50}
                onFilesSelected={handleAudioSelected}
                label="Or upload podcast audio"
                description="MP3, WAV, M4A up to 50MB"
              />
              {audioFile && (
                <p className="text-sm text-muted-foreground">
                  Loaded: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" /> Background Music (optional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Add royalty-free instrumental music. Use sites like Pixabay, FreePD, or Incompetech for non-copyright music.
              </p>
              <FileUploadZone
                accept="audio/*"
                maxSize={50}
                onFilesSelected={handleMusicSelected}
                label="Upload background music"
                description="MP3, WAV up to 50MB"
              />
              {musicFile && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Music: {musicFile.name} ({(musicFile.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Music Volume: {musicVolume}%</label>
                    <Slider
                      value={[musicVolume]}
                      onValueChange={([v]) => setMusicVolume(v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview Stage */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-lg">Preview Stage</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWaveform(!showWaveform)}
                >
                  {showWaveform ? "Hide" : "Show"} Waveform
                </Button>
                <Button
                  onClick={playAudio}
                  className={isPlaying ? "bg-destructive hover:bg-destructive/80" : "btn-primary-gradient"}
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 mr-2" /> Stop</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Play & Animate</>
                  )}
                </Button>
              </div>
            </div>

            <div
              ref={stageRef}
              className="rounded-2xl p-8 flex flex-col items-center justify-center gap-4"
              style={{ background: scene.gradient, minHeight: 340 }}
            >
              <div className={`flex items-center justify-center flex-wrap ${actors.length <= 3 ? "gap-8 md:gap-16" : "gap-4 md:gap-8"}`}>
                {actors.map((actor, i) => (
                  <div key={actor.id} className="flex flex-col items-center">
                    <canvas
                      ref={(el) => { canvasRefs.current[i] = el; }}
                      width={actors.length <= 3 ? AVATAR_SIZE : Math.max(120, AVATAR_SIZE - (actors.length - 3) * 20)}
                      height={(actors.length <= 3 ? AVATAR_SIZE : Math.max(120, AVATAR_SIZE - (actors.length - 3) * 20)) + 40}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>

              {showWaveform && (
                <AudioWaveform
                  analyser={analyserRef.current}
                  isPlaying={isPlaying}
                />
              )}
            </div>

            {/* Export actions */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" onClick={downloadAudio} disabled={!audioFile}>
                <Download className="w-4 h-4 mr-2" /> Download Audio
              </Button>
              <Button variant="outline" onClick={exportVideo} disabled={!audioFile || isExporting}>
                <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export Video (.webm)"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              All processing happens locally — your files never leave your device.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-secondary"><kbd>Space</kbd> Play/Pause</span>
              <span className="px-2 py-1 rounded bg-secondary"><kbd>R</kbd> Record</span>
              <span className="px-2 py-1 rounded bg-secondary"><kbd>Ctrl+E</kbd> Export Video</span>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

// WAV encoder helper
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const channels = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default PodcastAvatar;
