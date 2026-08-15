/**
 * Procedural Web Audio API sound synthesis — zero external audio files.
 * All sounds are generated from oscillators and noise buffers at runtime.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Rising sine-wave sweep used during a press-and-hold gesture.
 * Pitch climbs from `startFreq` to `endFreq` over `duration` seconds.
 * Returns a stop() function to cancel early (e.g. if the user releases).
 */
export function playHoldSweep(
  startFreq = 220,
  endFreq = 440,
  duration = 0.8,
): () => void {
  const audio = getCtx();
  if (!audio) return () => {};

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, audio.currentTime + duration);

  const peak = 0.08;
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(peak, audio.currentTime + 0.05);
  gain.gain.setValueAtTime(peak, audio.currentTime + duration - 0.1);
  gain.gain.linearRampToValueAtTime(0, audio.currentTime + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration + 0.05);

  return () => {
    try {
      gain.gain.cancelScheduledValues(audio.currentTime);
      gain.gain.setTargetAtTime(0, audio.currentTime, 0.02);
      osc.stop(audio.currentTime + 0.05);
    } catch {
      /* already stopped */
    }
  };
}

/**
 * Soft dual-tone chord chime played when a hold-to-complete finishes.
 * Uses two sine oscillators (root + fifth) with a gentle envelope.
 */
export function playCompletionChime(): void {
  const audio = getCtx();
  if (!audio) return;

  const tones = [523.25, 783.99]; // C5 + G5
  const now = audio.currentTime;
  const dur = 0.6;

  tones.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const peak = i === 0 ? 0.12 : 0.08;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  });
}

// ── Ambient noise generator ──────────────────────────────────────────────

let noiseSource: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;
let noiseFilter: BiquadFilterNode | null = null;

/**
 * Starts a continuous ambient noise stream.
 * `type` controls the spectral colour: 'brown' (warm, low-frequency) or 'white'.
 */
export function startAmbientNoise(type: 'brown' | 'white' = 'brown'): void {
  const audio = getCtx();
  if (!audio) return;
  stopAmbientNoise();

  const bufferSize = 2 * audio.sampleRate;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  noiseSource = audio.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  noiseFilter = audio.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = type === 'brown' ? 400 : 2000;

  noiseGain = audio.createGain();
  noiseGain.gain.setValueAtTime(0, audio.currentTime);
  noiseGain.gain.linearRampToValueAtTime(type === 'brown' ? 0.15 : 0.04, audio.currentTime + 1.5);

  noiseSource.connect(noiseFilter).connect(noiseGain).connect(audio.destination);
  noiseSource.start();
}

export function stopAmbientNoise(): void {
  const audio = getCtx();
  if (!audio) return;

  if (noiseGain) {
    try {
      noiseGain.gain.cancelScheduledValues(audio.currentTime);
      noiseGain.gain.setTargetAtTime(0, audio.currentTime, 0.3);
    } catch {
      /* ignore */
    }
  }
  if (noiseSource) {
    try {
      noiseSource.stop(audio.currentTime + 0.8);
    } catch {
      /* ignore */
    }
  }
  noiseSource = null;
  noiseGain = null;
  noiseFilter = null;
}

// ── Timer completion sound ─────────────────────────────────────────────────

export function playTimerBell(): void {
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;
  const freqs = [659.25, 987.77, 1318.51]; // E5, B5, E6 — bright triad
  freqs.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    const start = now + i * 0.12;
    const peak = 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 1.3);
  });
}
