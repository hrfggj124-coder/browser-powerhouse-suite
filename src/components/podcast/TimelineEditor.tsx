import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Actor, TimelineSegment } from "./types";

interface TimelineEditorProps {
  actors: Actor[];
  segments: TimelineSegment[];
  onSegmentsChange: (segments: TimelineSegment[]) => void;
  audioDuration: number;
  currentTime: number;
  isPlaying: boolean;
  waveformPeaks?: number[];
}

const COLORS = [
  "bg-violet-500", "bg-pink-500", "bg-sky-500",
  "bg-emerald-500", "bg-amber-500", "bg-cyan-500",
];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const TimelineEditor = ({
  actors,
  segments,
  onSegmentsChange,
  audioDuration,
  currentTime,
  isPlaying,
}: TimelineEditorProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ segId: string; edge: "start" | "end" } | null>(null);

  const duration = audioDuration || 60; // default 60s if no audio

  const addSegment = () => {
    const lastEnd = segments.length > 0 ? Math.max(...segments.map((s) => s.endTime)) : 0;
    const segLength = Math.min(5, duration - lastEnd);
    if (segLength <= 0) return;
    onSegmentsChange([
      ...segments,
      {
        id: String(Date.now()),
        actorIndex: segments.length % actors.length,
        startTime: lastEnd,
        endTime: lastEnd + segLength,
      },
    ]);
  };

  const removeSegment = (id: string) => {
    onSegmentsChange(segments.filter((s) => s.id !== id));
  };

  const updateSegment = (id: string, updates: Partial<TimelineSegment>) => {
    onSegmentsChange(
      segments.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const autoFill = () => {
    if (actors.length === 0) return;
    const segCount = Math.max(actors.length * 2, 4);
    const segLen = duration / segCount;
    const newSegments: TimelineSegment[] = [];
    for (let i = 0; i < segCount; i++) {
      newSegments.push({
        id: String(Date.now() + i),
        actorIndex: i % actors.length,
        startTime: i * segLen,
        endTime: (i + 1) * segLen,
      });
    }
    onSegmentsChange(newSegments);
  };

  const getPositionFromMouse = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  const handleMouseDown = (segId: string, edge: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging({ segId, edge });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const time = getPositionFromMouse(e.clientX);
      const seg = segments.find((s) => s.id === dragging.segId);
      if (!seg) return;

      if (dragging.edge === "start") {
        const newStart = Math.max(0, Math.min(time, seg.endTime - 0.5));
        updateSegment(dragging.segId, { startTime: newStart });
      } else {
        const newEnd = Math.min(duration, Math.max(time, seg.startTime + 0.5));
        updateSegment(dragging.segId, { endTime: newEnd });
      }
    },
    [dragging, segments, duration, getPositionFromMouse]
  );

  const handleMouseUp = () => setDragging(null);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Speaker Timeline
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={autoFill}>
            Auto-Fill
          </Button>
          <Button variant="outline" size="sm" onClick={addSegment}>
            <Plus className="w-4 h-4 mr-1" /> Add Segment
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag segment edges to adjust timing. Each segment controls which actor speaks during that period.
        {!audioDuration && " Upload audio to see actual duration."}
      </p>

      {/* Visual timeline track */}
      <div
        ref={trackRef}
        className="relative h-16 rounded-lg bg-secondary/50 border border-border/30 overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Time markers */}
        {Array.from({ length: Math.ceil(duration / 10) + 1 }, (_, i) => i * 10).map((t) => (
          <div
            key={t}
            className="absolute top-0 h-full border-l border-border/20"
            style={{ left: `${(t / duration) * 100}%` }}
          >
            <span className="text-[9px] text-muted-foreground/50 ml-1">{formatTime(t)}</span>
          </div>
        ))}

        {/* Segments */}
        {segments.map((seg) => {
          const left = (seg.startTime / duration) * 100;
          const width = ((seg.endTime - seg.startTime) / duration) * 100;
          const colorClass = COLORS[seg.actorIndex % COLORS.length];
          const actorName = actors[seg.actorIndex]?.name || `Actor ${seg.actorIndex + 1}`;

          return (
            <div
              key={seg.id}
              className={`absolute top-2 bottom-2 rounded-md ${colorClass} opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center group`}
              style={{ left: `${left}%`, width: `${width}%`, minWidth: 20 }}
            >
              <span className="text-[10px] font-medium text-white truncate px-1">
                {actorName}
              </span>
              {/* Drag handles */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 rounded-l-md"
                onMouseDown={handleMouseDown(seg.id, "start")}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 rounded-r-md"
                onMouseDown={handleMouseDown(seg.id, "end")}
              />
            </div>
          );
        })}

        {/* Playback cursor */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="w-2 h-2 bg-white rounded-full -ml-[3px] -mt-0.5" />
          </div>
        )}
      </div>

      {/* Actor legend */}
      <div className="flex flex-wrap gap-2">
        {actors.map((actor, i) => (
          <div key={actor.id} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded-sm ${COLORS[i % COLORS.length]}`} />
            <span className="text-muted-foreground">{actor.name}</span>
          </div>
        ))}
      </div>

      {/* Segment list */}
      {segments.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-auto">
          {segments.map((seg, i) => (
            <div key={seg.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/30">
              <div className={`w-2 h-2 rounded-full ${COLORS[seg.actorIndex % COLORS.length]}`} />
              <Select
                value={String(seg.actorIndex)}
                onValueChange={(v) => updateSegment(seg.id, { actorIndex: parseInt(v) })}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actors.map((a, idx) => (
                    <SelectItem key={a.id} value={String(idx)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {formatTime(seg.startTime)} — {formatTime(seg.endTime)}
              </span>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={() => removeSegment(seg.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {segments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No segments yet. Click "Auto-Fill" for automatic distribution or "Add Segment" to add manually.
          <br />
          <span className="text-xs">Without segments, actors alternate every 4 seconds.</span>
        </p>
      )}
    </div>
  );
};

export default TimelineEditor;
