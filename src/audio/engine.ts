import * as Tone from 'tone';

let ready = false;
let lead: Tone.PolySynth | null = null;

function getLead(): Tone.PolySynth {
  if (!lead) {
    lead = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.35, release: 0.4 },
      volume: -8,
    }).toDestination();
  }
  return lead;
}

export async function ensureAudio(): Promise<void> {
  if (!ready) {
    await Tone.start();
    getLead();
    ready = true;
  }
}

export function playNotes(freqs: number[], noteDur = 0.35, gap = 0.08, start?: number): void {
  if (!ready) return;
  const synth = getLead();
  let t = start ?? Tone.now() + 0.02;
  for (const freq of freqs) {
    synth.triggerAttackRelease(freq, noteDur, t);
    t += noteDur + gap;
  }
}

export function playChord(freqs: number[], duration = 1.1): void {
  if (!ready) return;
  getLead().triggerAttackRelease(freqs, duration);
}
