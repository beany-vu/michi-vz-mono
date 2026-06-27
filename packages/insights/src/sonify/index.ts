// Sonification — play a data series as pitch over time (an accessibility aid:
// "hear the trend"). `valuesToTones` is a pure, deterministic mapping (testable);
// `sonify` schedules them via the Web Audio API and is a graceful no-op where there
// is no AudioContext (SSR / jsdom).
export interface Tone {
  /** start time in seconds from playback start. */
  time: number;
  /** duration in seconds. */
  duration: number;
  /** frequency in Hz. */
  freq: number;
  /** the source data value. */
  value: number;
}

export interface SonifyOptions {
  /** total playback length in seconds (default 3). */
  duration?: number;
  /** pitch for the minimum value (default 220 Hz). */
  minFreq?: number;
  /** pitch for the maximum value (default 880 Hz). */
  maxFreq?: number;
}

/** Map values to a tone-per-value sweep (low value → low pitch). Pure + deterministic. */
export function valuesToTones(values: number[], options: SonifyOptions = {}): Tone[] {
  const duration = options.duration ?? 3;
  const minFreq = options.minFreq ?? 220;
  const maxFreq = options.maxFreq ?? 880;
  const finite = values.filter((v) => Number.isFinite(v));
  if (values.length === 0 || finite.length === 0) return [];
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const span = hi - lo || 1;
  const step = duration / values.length;
  return values.map((v, i) => ({
    time: i * step,
    duration: step,
    value: v,
    freq: minFreq + ((v - lo) / span) * (maxFreq - minFreq),
  }));
}

/** Play a series as sound via Web Audio. No-op when AudioContext is unavailable. */
export async function sonify(values: number[], options: SonifyOptions = {}): Promise<void> {
  const tones = valuesToTones(values, options);
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const AC = g.AudioContext ?? g.webkitAudioContext;
  if (!AC || tones.length === 0) return; // SSR / jsdom / no Web Audio

  const ctx = new AC();
  const t0 = ctx.currentTime;
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = tone.freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, t0 + tone.time);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + tone.time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.time + tone.duration);
    osc.start(t0 + tone.time);
    osc.stop(t0 + tone.time + tone.duration);
  }
}
