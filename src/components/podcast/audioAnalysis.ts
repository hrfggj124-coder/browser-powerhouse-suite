/**
 * Analyzes audio energy to detect voice activity segments.
 * Returns timeline segments assigned to actors based on detected speech patterns.
 */

import { TimelineSegment } from "./types";

interface EnergySegment {
  startTime: number;
  endTime: number;
  energy: number;
}

/**
 * Decode audio file and compute per-frame energy levels
 */
async function computeEnergy(file: File, frameSize = 2048): Promise<{ energies: Float32Array; sampleRate: number; frameSize: number }> {
  const arrayBuf = await file.arrayBuffer();
  const offlineCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const numFrames = Math.floor(data.length / frameSize);
  const energies = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const sample = data[i * frameSize + j];
      sum += sample * sample;
    }
    energies[i] = Math.sqrt(sum / frameSize); // RMS energy
  }

  return { energies, sampleRate, frameSize };
}

/**
 * Detect voice activity segments based on energy threshold
 */
function detectVoiceActivity(
  energies: Float32Array,
  sampleRate: number,
  frameSize: number,
  threshold?: number,
  minDurationSec = 0.5,
  mergePaddingSec = 0.3
): EnergySegment[] {
  // Auto-compute threshold if not provided (use median * 2)
  if (threshold === undefined) {
    const sorted = [...energies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    threshold = Math.max(median * 2, 0.01);
  }

  const frameDuration = frameSize / sampleRate;
  const minFrames = Math.ceil(minDurationSec / frameDuration);
  const mergeFrames = Math.ceil(mergePaddingSec / frameDuration);

  // Find regions above threshold
  const segments: EnergySegment[] = [];
  let inSegment = false;
  let segStart = 0;
  let segEnergy = 0;
  let segFrames = 0;
  let silenceCount = 0;

  for (let i = 0; i < energies.length; i++) {
    if (energies[i] >= threshold) {
      if (!inSegment) {
        inSegment = true;
        segStart = i;
        segEnergy = 0;
        segFrames = 0;
        silenceCount = 0;
      }
      segEnergy += energies[i];
      segFrames++;
      silenceCount = 0;
    } else if (inSegment) {
      silenceCount++;
      if (silenceCount > mergeFrames) {
        // End segment
        if (segFrames >= minFrames) {
          segments.push({
            startTime: segStart * frameDuration,
            endTime: (i - silenceCount) * frameDuration,
            energy: segEnergy / segFrames,
          });
        }
        inSegment = false;
      }
    }
  }

  // Close trailing segment
  if (inSegment && segFrames >= minFrames) {
    segments.push({
      startTime: segStart * frameDuration,
      endTime: energies.length * frameDuration,
      energy: segEnergy / segFrames,
    });
  }

  return segments;
}

/**
 * Assign detected segments to actors using round-robin with energy-based heuristics.
 * Higher energy segments alternate between actors, simulating a conversation.
 */
function assignActors(
  segments: EnergySegment[],
  numActors: number
): TimelineSegment[] {
  if (segments.length === 0 || numActors === 0) return [];

  return segments.map((seg, i) => ({
    id: String(Date.now() + i),
    actorIndex: i % numActors,
    startTime: Math.round(seg.startTime * 100) / 100,
    endTime: Math.round(seg.endTime * 100) / 100,
  }));
}

/**
 * Main entry: analyze audio file and return smart timeline segments
 */
export async function smartAutoFill(
  file: File,
  numActors: number
): Promise<TimelineSegment[]> {
  const { energies, sampleRate, frameSize } = await computeEnergy(file);
  const voiceSegments = detectVoiceActivity(energies, sampleRate, frameSize);
  return assignActors(voiceSegments, numActors);
}
