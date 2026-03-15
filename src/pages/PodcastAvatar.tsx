import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Play, Pause, Mic, Square, Circle, Download, Music, Plus, Trash2, GripVertical, Save, FolderOpen, Captions, Settings, Sparkles, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ToolHeader from "@/components/shared/ToolHeader";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ActorConfig from "@/components/podcast/ActorConfig";
import AudioWaveform from "@/components/podcast/AudioWaveform";
import TimelineEditor from "@/components/podcast/TimelineEditor";
import ActorPresets from "@/components/podcast/ActorPresets";
import BackgroundGenerator from "@/components/podcast/BackgroundGenerator";
import EpisodeTemplates, { EpisodeTemplate } from "@/components/podcast/EpisodeTemplates";
import { drawAvatar } from "@/components/podcast/drawAvatar";
import { smartAutoFill, buildTimelineFromTranscription } from "@/components/podcast/audioAnalysis";
import { supabase } from "@/integrations/supabase/client";
import {
  Actor, ActorPreset, TimelineSegment, TranscriptionResult, TranscriptionWord, BACKGROUND_SCENES, defaultActors, AVATAR_SIZE, MOUTH_STATES,
} from "@/components/podcast/types";

const RESOLUTION_PRESETS = [
  { label: "480p", width: 854, height: 480 },
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
];

const MUSIC_PRESETS = [
  { label: "Chill Podcast", prompt: "Calm lo-fi background music for a podcast, soft beats, ambient" },
  { label: "News Theme", prompt: "Professional news broadcast background music, serious, corporate" },
  { label: "Upbeat Talk", prompt: "Upbeat cheerful background music for a talk show, positive vibes" },
  { label: "Tech Review", prompt: "Modern electronic background music for a tech review podcast" },
  { label: "Storytelling", prompt: "Gentle ambient music for storytelling, emotional, cinematic" },
];

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
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionText, setCaptionText] = useState("");
  const [captionHighlight, setCaptionHighlight] = useState<{ actorName: string; words: { text: string; active: boolean }[] } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [exportResolution, setExportResolution] = useState("720p");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
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
        mouthYOffset: 0,
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

  // Transcribe audio using ElevenLabs STT
  const transcribeAudio = async () => {
    if (!audioFile) {
      toast.error("Upload audio first");
      return;
    }

    setIsTranscribing(true);
    toast.info("Transcribing audio with AI... This may take a moment.");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Transcription failed");
      }

      const result: TranscriptionResult = await response.json();
      setTranscription(result);

      // Auto-build timeline from transcription with diarization
      const segments = buildTimelineFromTranscription(result, actors.length);
      if (segments.length > 0) {
        setTimelineSegments(segments);
        toast.success(`Transcribed! ${segments.length} speaking segments detected with real captions.`);
      } else {
        toast.success("Transcription complete! Use Smart Fill for timeline.");
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      if (err.message?.includes("429")) {
        toast.error("Rate limited. Try again later.");
      } else {
        toast.error(err.message || "Transcription failed");
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // Generate background music with AI
  const generateMusic = async (prompt: string) => {
    setIsGeneratingMusic(true);
    toast.info("Generating background music with AI...");

    try {
      const duration = audioDuration > 0 ? Math.min(Math.ceil(audioDuration), 120) : 30;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, duration }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Music generation failed");
      }

      const data = await response.json();
      if (data.audioContent) {
        // Convert base64 to File
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const resp = await fetch(audioUrl);
        const blob = await resp.blob();
        const file = new File([blob], "ai-music.mp3", { type: "audio/mpeg" });
        setMusicFile(file);
        // Auto-set music volume lower for podcast
        setMusicVolume(20);
        toast.success("Background music generated and auto-adjusted!");
      }
    } catch (err: any) {
      console.error("Music generation error:", err);
      if (err.message?.includes("429")) {
        toast.error("Rate limited. Try again later.");
      } else if (err.message?.includes("402")) {
        toast.error("Insufficient credits for music generation.");
      } else {
        toast.error(err.message || "Music generation failed");
      }
    } finally {
      setIsGeneratingMusic(false);
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
    return Math.floor(elapsedSec / 4) % actors.length;
  }, [timelineSegments, actors.length]);

  // Get word-by-word caption with highlighting for current time
  const getWordHighlightCaption = useCallback((elapsedSec: number): { actorName: string; words: { text: string; active: boolean }[] } | null => {
    if (timelineSegments.length === 0) return null;
    const seg = timelineSegments.find(
      (s) => elapsedSec >= s.startTime && elapsedSec < s.endTime
    );
    if (!seg) return null;
    const actor = actors[seg.actorIndex % actors.length];
    if (!actor) return null;

    // Use transcription word timestamps for highlighting
    if (transcription?.words && seg.transcript) {
      const segWords = transcription.words.filter(
        (w) => w.start >= seg.startTime && w.end <= seg.endTime
      );
      if (segWords.length > 0) {
        return {
          actorName: actor.name,
          words: segWords.map((w) => ({
            text: w.text,
            active: elapsedSec >= w.start && elapsedSec < w.end,
          })),
        };
      }
    }

    // Fallback: show full transcript or speech bubble
    const text = seg.transcript || actor.speechBubble || `${actor.name} is speaking...`;
    return {
      actorName: actor.name,
      words: text.split(" ").map((w) => ({ text: w, active: false })),
    };
  }, [timelineSegments, actors, transcription]);

  // Simple text caption for export canvas rendering
  const getCaptionForTime = useCallback((elapsedSec: number): string => {
    const highlight = getWordHighlightCaption(elapsedSec);
    if (!highlight) return "";
    return `${highlight.actorName}: "${highlight.words.map(w => w.text).join(" ")}"`;
  }, [getWordHighlightCaption]);

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

    if (showCaptions) {
      const highlight = getWordHighlightCaption(elapsed);
      setCaptionText(highlight ? `${highlight.actorName}: "${highlight.words.map(w => w.text).join(" ")}"` : "");
      setCaptionHighlight(highlight);
    }

    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) {
        const isActive = i === actorIdx;
        const mouth = isActive ? mouthVal : Math.max(0, mouthVal * 0.1);
        drawAvatar(canvas, actors[i], mouth, isActive);
      }
    });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [actors, getActiveActorAtTime, getCaptionForTime, showCaptions]);

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCaptionText("");
    setCaptionHighlight(null);
    cancelAnimationFrame(animFrameRef.current);
    setMouthOpen(0);
    try { musicSourceRef.current?.stop(); } catch { /* already stopped */ }
    try { audioCtxRef.current?.close(); } catch { /* ok */ }
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas && actors[i]) drawAvatar(canvas, actors[i], 0, false);
    });
  };

  const applyTemplate = (template: EpisodeTemplate) => {
    const newActors: Actor[] = template.actors.map((a, i) => ({
      ...a,
      id: String(Date.now() + i),
      image: null,
      imageUrl: null,
    }));
    setActors(newActors);
    setSelectedScene(template.sceneId);
    setCustomBackgroundUrl(null);
    setMusicVolume(template.musicVolume);
    setTimelineSegments([]);
    setTranscription(null);
    toast.success(`Applied "${template.name}" template! Upload audio to get started.`);
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

  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = musicVolume / 100;
    }
  }, [musicVolume]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

  const drawCaptions = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, text: string, elapsed?: number) => {
    if (!text) return;
    const fontSize = Math.max(14, Math.floor(canvasWidth / 45));
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const padding = 12;

    // Get word highlight data if available
    const highlight = elapsed !== undefined ? getWordHighlightCaption(elapsed) : null;
    const displayText = highlight ? `${highlight.actorName}: ${highlight.words.map(w => w.text).join(" ")}` : text;

    const textMetrics = ctx.measureText(displayText);
    const bgWidth = Math.min(textMetrics.width + padding * 2, canvasWidth - 20);
    const bgHeight = fontSize + padding * 2;
    const bgX = (canvasWidth - bgWidth) / 2;
    const bgY = canvasHeight - bgHeight - 20;

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8);
    ctx.fill();

    if (highlight) {
      // Draw word-by-word with highlighting
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const prefix = `${highlight.actorName}: `;
      let x = bgX + padding;
      const y = bgY + bgHeight / 2;

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(prefix, x, y);
      x += ctx.measureText(prefix).width;

      for (const w of highlight.words) {
        ctx.fillStyle = w.active ? "#a78bfa" : "#ffffff";
        if (w.active) ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        else ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.fillText(w.text + " ", x, y);
        x += ctx.measureText(w.text + " ").width;
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayText, canvasWidth / 2, bgY + bgHeight / 2, bgWidth - padding * 2);
    }
  };

  const exportVideo = async () => {
    if (!audioFile) {
      toast.error("Upload audio first to export");
      return;
    }

    setIsExporting(true);
    const res = RESOLUTION_PRESETS.find((r) => r.label === exportResolution) || RESOLUTION_PRESETS[1];
    toast.info(`Exporting ${res.label} video... This may take a moment.`);

    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = res.width;
      exportCanvas.height = res.height;
      const ctx = exportCanvas.getContext("2d")!;

      const stream = exportCanvas.captureStream(30);

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
        a.download = `podcast-avatar-${res.label}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        audioCtx.close();
        setIsExporting(false);
        toast.success(`Video exported at ${res.label}!`);
      };

      let bgImage: HTMLImageElement | null = null;
      if (customBackgroundUrl) {
        bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        bgImage.src = customBackgroundUrl;
        await new Promise<void>((resolve) => {
          bgImage!.onload = () => resolve();
          bgImage!.onerror = () => resolve();
        });
      }

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
        if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
          const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
          const canvasRatio = exportCanvas.width / exportCanvas.height;
          let sx = 0, sy = 0, sw = bgImage.naturalWidth, sh = bgImage.naturalHeight;
          if (imgRatio > canvasRatio) {
            sw = bgImage.naturalHeight * canvasRatio;
            sx = (bgImage.naturalWidth - sw) / 2;
          } else {
            sh = bgImage.naturalWidth / canvasRatio;
            sy = (bgImage.naturalHeight - sh) / 2;
          }
          ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, exportCanvas.width, exportCanvas.height);
        } else {
          const gradient = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
          gradient.addColorStop(0, "#1a1a2e");
          gradient.addColorStop(1, "#0f0f1a");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        // Draw actors
        const avatarScale = Math.min(1, exportCanvas.width / (actors.length * (AVATAR_SIZE + 40)));
        const scaledSize = Math.floor(AVATAR_SIZE * Math.max(0.6, avatarScale));
        const spacing = exportCanvas.width / (actors.length + 1);
        const actorY = exportCanvas.height * 0.3;

        actors.forEach((actor, i) => {
          const tmpCanvas = document.createElement("canvas");
          tmpCanvas.width = scaledSize;
          tmpCanvas.height = scaledSize + 40;
          const isActive = i === actorIdx;
          const mouth = isActive ? mouthVal : Math.max(0, mouthVal * 0.1);
          drawAvatar(tmpCanvas, actor, mouth, isActive);
          const x = spacing * (i + 1) - scaledSize / 2;
          ctx.drawImage(tmpCanvas, x, actorY);
        });

        // Waveform
        if (showWaveform) {
          const barWidth = exportCanvas.width / 64;
          for (let i = 0; i < 64; i++) {
            const barHeight = (dataArray[i * Math.floor(dataArray.length / 64)] / 255) * 40;
            ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
            ctx.fillRect(i * barWidth, exportCanvas.height - barHeight, barWidth - 1, barHeight);
          }
        }

        // Captions with word-by-word highlighting
        if (showCaptions) {
          const caption = getCaptionForTime(elapsed);
          drawCaptions(ctx, exportCanvas.width, exportCanvas.height, caption, elapsed);
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

  const downloadAudio = async () => {
    if (!audioFile) {
      toast.error("No audio to download");
      return;
    }

    if (!musicFile) {
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
      const voiceBuf = await (new OfflineAudioContext(2, 44100 * 300, 44100)).decodeAudioData(await audioFile.arrayBuffer());
      const offline = new OfflineAudioContext(2, voiceBuf.length, voiceBuf.sampleRate);
      const v2 = offline.createBufferSource();
      v2.buffer = voiceBuf;
      v2.connect(offline.destination);
      const musicBuf = await offline.decodeAudioData(await musicFile.arrayBuffer());
      const m2 = offline.createBufferSource();
      m2.buffer = musicBuf;
      const g2 = offline.createGain();
      g2.gain.value = musicVolume / 100;
      m2.connect(g2);
      g2.connect(offline.destination);
      v2.start();
      m2.start();
      const rendered = await offline.startRendering();
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

  const exportProject = () => {
    const project = {
      version: 1,
      actors: actors.map(({ image, imageUrl, ...rest }) => rest),
      timelineSegments,
      selectedScene,
      musicVolume,
      showWaveform,
      showCaptions,
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
            mouthYOffset: a.mouthYOffset ?? 0,
          }))
        );
        if (project.timelineSegments) setTimelineSegments(project.timelineSegments);
        if (project.selectedScene) setSelectedScene(project.selectedScene);
        if (project.musicVolume !== undefined) setMusicVolume(project.musicVolume);
        if (project.showWaveform !== undefined) setShowWaveform(project.showWaveform);
        if (project.showCaptions !== undefined) setShowCaptions(project.showCaptions);
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
          description="Create animated talking avatars for podcasts with AI transcription, background music generation, waveforms, captions, and video export."
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

          {/* Episode Templates */}
          <EpisodeTemplates onApplyTemplate={applyTemplate} />

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
              setCurrentTime(time);
              if (isPlaying) {
                playStartTimeRef.current = Date.now() - time * 1000;
              }
            }}
            audioFile={audioFile}
            onSmartAutoFill={async () => {
              if (!audioFile) {
                toast.error("Upload audio first for smart auto-fill");
                return;
              }
              toast.info("Analyzing audio with pitch detection...");
              try {
                const segments = await smartAutoFill(audioFile, actors.length);
                setTimelineSegments(segments);
                toast.success(`Detected ${segments.length} speaking segments with speaker clustering!`);
              } catch (err) {
                console.error(err);
                toast.error("Failed to analyze audio");
              }
            }}
          />

          {/* AI Transcription */}
          {audioFile && (
            <div className="glass-card p-6 space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Captions className="w-5 h-5 text-primary" /> AI Transcription & Smart Captions
              </h3>
              <p className="text-xs text-muted-foreground">
                Transcribe your audio with AI to get real captions and automatic speaker detection. This replaces static speech bubble text with actual spoken words.
              </p>
              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="btn-primary-gradient"
              >
                {isTranscribing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transcribing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Transcribe Audio with AI</>
                )}
              </Button>
              {transcription && (
                <div className="bg-secondary/30 rounded-lg p-3 max-h-32 overflow-auto">
                  <p className="text-xs text-muted-foreground mb-1">Transcript preview:</p>
                  <p className="text-sm">{transcription.text.slice(0, 500)}{transcription.text.length > 500 ? "..." : ""}</p>
                </div>
              )}
            </div>
          )}

          <BackgroundGenerator
            selectedScene={selectedScene}
            onSelectScene={(id) => {
              setSelectedScene(id);
              setCustomBackgroundUrl(null);
            }}
            onCustomBackground={(url) => {
              setCustomBackgroundUrl(url);
              setSelectedScene("");
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
                <Music className="w-5 h-5 text-primary" /> Background Music
              </h3>

              {/* AI Music Generation */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Generate music with AI or upload your own
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MUSIC_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => generateMusic(preset.prompt)}
                      disabled={isGeneratingMusic}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (musicPrompt.trim()) {
                      generateMusic(musicPrompt.trim());
                      setMusicPrompt("");
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder="Describe your music..."
                    className="flex-1 h-8 text-xs"
                    disabled={isGeneratingMusic}
                  />
                  <Button type="submit" size="sm" className="h-8" disabled={isGeneratingMusic || !musicPrompt.trim()}>
                    {isGeneratingMusic ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </Button>
                </form>
                {isGeneratingMusic && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Generating music...
                  </p>
                )}
              </div>

              <FileUploadZone
                accept="audio/*"
                maxSize={50}
                onFilesSelected={handleMusicSelected}
                label="Or upload background music"
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
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Captions className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Captions</span>
                  <Switch checked={showCaptions} onCheckedChange={setShowCaptions} />
                </div>
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
              className="relative rounded-2xl p-8 flex flex-col items-center justify-center gap-4 overflow-hidden"
              style={{ background: stageBackground, minHeight: 340, aspectRatio: "16/9" }}
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

              {/* Live captions overlay with word-by-word highlighting */}
              {showCaptions && isPlaying && captionHighlight && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
                  <div className="bg-black/75 text-white px-4 py-2 rounded-lg text-sm font-medium max-w-[80%] text-center">
                    <span className="text-white/60 mr-1">{captionHighlight.actorName}:</span>
                    {captionHighlight.words.map((w, i) => (
                      <span
                        key={i}
                        className={`transition-colors duration-100 ${
                          w.active ? "text-primary font-bold" : "text-white"
                        }`}
                      >
                        {w.text}{i < captionHighlight.words.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export actions */}
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <Button variant="outline" onClick={downloadAudio} disabled={!audioFile}>
                <Download className="w-4 h-4 mr-2" /> Download Audio
              </Button>
              <div className="flex items-center gap-2">
                <Select value={exportResolution} onValueChange={setExportResolution}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_PRESETS.map((r) => (
                      <SelectItem key={r.label} value={r.label}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportVideo} disabled={!audioFile || isExporting}>
                  <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export Video (.webm)"}
                </Button>
              </div>
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
  const format = 1;
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
