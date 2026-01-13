// src/utils/stock/chimes.ts
let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

/**
 * Browsers require a user gesture before audio can play.
 * Call this once from a click/tap/keypress handler.
 */
export async function enableSound(): Promise<void> {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
}

export type ChimeKey = "green" | "cyan" | "orange" | "red";

/**
 * 4 distinct two-tone chimes (short, easy to tell apart).
 */
export function playChime(key: ChimeKey) {
  const c = getCtx();
  const now = c.currentTime;

  const tones: Record<ChimeKey, [number, number]> = {
    green: [880, 1320],
    cyan: [740, 1110],
    orange: [440, 660],
    red: [330, 495],
  };

  const [f1, f2] = tones[key];

  const gain = c.createGain();
  gain.connect(c.destination);

  // fast attack, quick decay (not annoying)
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.setValueAtTime(f1, now);
  o1.connect(gain);
  o1.start(now);
  o1.stop(now + 0.10);

  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(f2, now + 0.08);
  o2.connect(gain);
  o2.start(now + 0.08);
  o2.stop(now + 0.18);
}
