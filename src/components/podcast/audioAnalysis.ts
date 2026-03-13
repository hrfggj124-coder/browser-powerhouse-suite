/**
 * Analyzes audio energy to detect voice activity segments.
 * Uses energy-based clustering to better assign speakers.
 */

import { TimelineSegment, TranscriptionResult } from "./types";

interface EnergySegment {
  startTime: number;
  endTime: number;
  energy: number;
  pitch: number; // avg pitch estimate for speaker differentiation
}

async function computeEnergy(file: File, frameSize = 2048): Promise<{ energies: Float32Array; pitches: Float32Array; sampleRate: number; frameSize: number }> {
  const arrayBuf = await file.arrayBuffer();
  const offlineCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const numFrames = Math.floor(data.length / frameSize);
  const energies = new Float32Array(numFrames);
  const pitches = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    let zeroCrossings = 0;
    for (let j = 0; j < frameSize; j++) {
      const sample = data[i * frameSize + j];
      sum += sample * sample;
      if (j > 0 && Math.sign(data[i * frameSize + j]) !== Math.sign(data[i * frameSize + j - 1])) {
        zeroCrossings++;
      }
    }
    energies[i] = Math.sqrt(sum / frameSize);
    // Zero-crossing rate as rough pitch proxy
    pitches[i] = (zeroCrossings / frameSize) * sampleRate;
  }

  return { energies, pitches, sampleRate, frameSize };
}

function detectVoiceActivity(
  energies: Float32Array,
  pitches: Float32Array,
  sampleRate: number,
  frameSize: number,
  threshold?: number,
  minDurationSec = 0.3,
  mergePaddingSec = 0.25
): EnergySegment[] {
  if (threshold === undefined) {
    const sorted = [...energies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    threshold = Math.max(median * 1.8, 0.008);
  }

  const frameDuration = frameSize / sampleRate;
  const minFrames = Math.ceil(minDurationSec / frameDuration);
  const mergeFrames = Math.ceil(mergePaddingSec / frameDuration);

  const segments: EnergySegment[] = [];
  let inSegment = false;
  let segStart = 0;
  let segEnergy = 0;
  let segPitch = 0;
  let segFrames = 0;
  let silenceCount = 0;

  for (let i = 0; i < energies.length; i++) {
    if (energies[i] >= threshold) {
      if (!inSegment) {
        inSegment = true;
        segStart = i;
        segEnergy = 0;
        segPitch = 0;
        segFrames = 0;
        silenceCount = 0;
      }
      segEnergy += energies[i];
      segPitch += pitches[i];
      segFrames++;
      silenceCount = 0;
    } else if (inSegment) {
      silenceCount++;
      if (silenceCount > mergeFrames) {
        if (segFrames >= minFrames) {
          segments.push({
            startTime: segStart * frameDuration,
            endTime: (i - silenceCount) * frameDuration,
            energy: segEnergy / segFrames,
            pitch: segPitch / segFrames,
          });
        }
        inSegment = false;
      }
    }
  }

  if (inSegment && segFrames >= minFrames) {
    segments.push({
      startTime: segStart * frameDuration,
      endTime: energies.length * frameDuration,
      energy: segEnergy / segFrames,
      pitch: segPitch / segFrames,
    });
  }

  return segments;
}

/**
 * Cluster segments by pitch into speaker groups using k-means-like approach
 */
function assignActorsByPitch(segments: EnergySegment[], numActors: number): TimelineSegment[] {
  if (segments.length === 0 || numActors === 0) return [];

  if (numActors === 1) {
    return segments.map((seg, i) => ({
      id: String(Date.now() + i),
      actorIndex: 0,
      startTime: Math.round(seg.startTime * 100) / 100,
      endTime: Math.round(seg.endTime * 100) / 100,
    }));
  }

  // Simple pitch-based clustering
  const pitchValues = segments.map(s => s.pitch);
  const minPitch = Math.min(...pitchValues);
  const maxPitch = Math.max(...pitchValues);
  const pitchRange = maxPitch - minPitch || 1;

  return segments.map((seg, i) => {
    // Normalize pitch to [0, 1] and assign actor bucket
    const normalizedPitch = (seg.pitch - minPitch) / pitchRange;
    const actorIndex = Math.min(numActors - 1, Math.floor(normalizedPitch * numActors));

    return {
      id: String(Date.now() + i),
      actorIndex,
      startTime: Math.round(seg.startTime * 100) / 100,
      endTime: Math.round(seg.endTime * 100) / 100,
    };
  });
}

/**
 * Build timeline from transcription with speaker diarization
 */
export function buildTimelineFromTranscription(
  transcription: TranscriptionResult,
  numActors: number
): TimelineSegment[] {
  if (!transcription.words || transcription.words.length === 0) return [];

  // Group consecutive words by speaker
  const speakerGroups: { speaker: string; words: typeof transcription.words; start: number; end: number }[] = [];
  let currentSpeaker = transcription.words[0].speaker || "speaker_0";
  let groupStart = transcription.words[0].start;
  let groupWords: typeof transcription.words = [transcription.words[0]];

  for (let i = 1; i < transcription.words.length; i++) {
    const word = transcription.words[i];
    const speaker = word.speaker || "speaker_0";
    if (speaker !== currentSpeaker || (word.start - groupWords[groupWords.length - 1].end) > 2) {
      speakerGroups.push({
        speaker: currentSpeaker,
        words: groupWords,
        start: groupStart,
        end: groupWords[groupWords.length - 1].end,
      });
      currentSpeaker = speaker;
      groupStart = word.start;
      groupWords = [word];
    } else {
      groupWords.push(word);
    }
  }
  speakerGroups.push({
    speaker: currentSpeaker,
    words: groupWords,
    start: groupStart,
    end: groupWords[groupWords.length - 1].end,
  });

  // Map unique speakers to actor indices
  const uniqueSpeakers = [...new Set(speakerGroups.map(g => g.speaker))];
  const speakerToActor: Record<string, number> = {};
  uniqueSpeakers.forEach((s, i) => {
    speakerToActor[s] = i % numActors;
  });

  return speakerGroups.map((group, i) => ({
    id: String(Date.now() + i),
    actorIndex: speakerToActor[group.speaker],
    startTime: Math.round(group.start * 100) / 100,
    endTime: Math.round(group.end * 100) / 100,
    transcript: group.words.map(w => w.text).join(" "),
  }));
}

export async function smartAutoFill(
  file: File,
  numActors: number
): Promise<TimelineSegment[]> {
  const { energies, pitches, sampleRate, frameSize } = await computeEnergy(file);
  const voiceSegments = detectVoiceActivity(energies, pitches, sampleRate, frameSize);
  return assignActorsByPitch(voiceSegments, numActors);
}
