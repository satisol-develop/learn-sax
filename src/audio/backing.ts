import {
  MembraneSynth,
  MetalSynth,
  MonoSynth,
  NoiseSynth,
  PolySynth,
  Synth,
  getTransport,
} from 'tone';
import {
  chordFreqs,
  cycleFrom,
  iiViIn,
  pc,
  type CycleDirection,
  type IIviProgression,
  type NoteName,
} from '../music/core';

type Transport = ReturnType<typeof getTransport>;

export interface JamOptions {
  bpm: number;
  cycle: CycleDirection;
  barsPerChord: number;
  startKey: NoteName;
  singleKeyLoop: boolean;
  countInBars: number;
}

export interface SectionInfo {
  keyIdx: number;
  key: NoteName;
  chordIdx: 0 | 1 | 2;
  progression: IIviProgression;
  symbol: string;
  barInSection: number;
  barsPerChord: number;
  cycleLength: number;
  isCountIn: boolean;
}

export interface JamCallbacks {
  onSection: (info: SectionInfo) => void;
  onBeat: (beat: number, isCountIn: boolean) => void;
}

const SWING = [0, 0.67, 1, 1.67, 2, 2.67, 3, 3.67];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function rootOf(progression: IIviProgression, chordIdx: 0 | 1 | 2): NoteName {
  return chordIdx === 0 ? progression.ii : chordIdx === 1 ? progression.V : progression.I;
}

export class JamPlayer {
  private transport: Transport | null = null;
  private kick: MembraneSynth | null = null;
  private snare: NoiseSynth | null = null;
  private hat: MetalSynth | null = null;
  private bass: MonoSynth | null = null;
  private comp: PolySynth | null = null;
  private click: Synth | null = null;

  private eventIds: number[] = [];
  private barCounter = 0;
  private options: JamOptions | null = null;
  private callbacks: JamCallbacks | null = null;
  private chain: IIviProgression[] = [];

  get isRunning(): boolean {
    return this.eventIds.length > 0;
  }

  private ensure(): void {
    if (this.transport) return;
    this.transport = getTransport();
    this.kick = new MembraneSynth({
      pitchDecay: 0.03,
      octaves: 5,
      envelope: { attack: 0.001, decay: 0.22, sustain: 0 },
      volume: -7,
    }).toDestination();
    this.snare = new NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
      volume: -16,
    }).toDestination();
    this.hat = new MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.2,
      volume: -20,
    }).toDestination();
    this.bass = new MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.18,
        sustain: 0.4,
        release: 0.3,
        baseFrequency: 120,
        octaves: 2,
      },
      volume: -8,
    }).toDestination();
    this.comp = new PolySynth(Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.25, sustain: 0.2, release: 0.35 },
      volume: -14,
    }).toDestination();
    this.click = new Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -22,
    }).toDestination();
  }

  start(options: JamOptions, callbacks: JamCallbacks): void {
    this.stop();
    this.ensure();
    const transport = this.transport as Transport;
    this.options = options;
    this.callbacks = callbacks;
    this.barCounter = 0;
    const keys = options.singleKeyLoop
      ? Array.from({ length: 12 }, () => options.startKey)
      : cycleFrom(options.startKey, options.cycle);
    this.chain = keys.map((k) => iiViIn(k));
    transport.bpm.value = options.bpm;
    this.comp?.releaseAll();
    const id = transport.scheduleRepeat((time: number) => this.scheduleBar(time), '1m');
    this.eventIds.push(id);
    transport.start('+0.08');
  }

  stop(): void {
    if (!this.transport) return;
    for (const id of this.eventIds) this.transport.clear(id);
    this.eventIds = [];
    this.transport.stop();
    this.transport.cancel();
    this.comp?.releaseAll();
  }

  setBpm(bpm: number): void {
    if (this.options) this.options.bpm = bpm;
    this.transport?.bpm.rampTo(bpm, 0.15);
  }

  private beatDur(): number {
    return 60 / (this.transport ? this.transport.bpm.value : 120);
  }

  private scheduleBar(time: number): void {
    const opts = this.options;
    const cbs = this.callbacks;
    if (!opts || !cbs) return;
    const bar = this.barCounter;
    this.barCounter += 1;
    const beat = this.beatDur();
    const at = (beats: number) => time + beats * beat;

    if (bar < opts.countInBars) {
      for (let b = 0; b < 4; b++) {
        this.click?.triggerAttackRelease(b === 0 ? 1046.5 : 784, 0.04, at(b));
        cbs.onBeat(b, true);
      }
      cbs.onSection({
        keyIdx: 0,
        key: opts.startKey,
        chordIdx: 0,
        progression: iiViIn(opts.startKey),
        symbol: '—',
        barInSection: 0,
        barsPerChord: opts.barsPerChord,
        cycleLength: 12,
        isCountIn: true,
      });
      return;
    }

    const gameBar = bar - opts.countInBars;
    const chordBars = opts.barsPerChord;
    const sectionIdx = Math.floor(gameBar / chordBars);
    const barInSection = gameBar % chordBars;
    const keyIdx = Math.floor(sectionIdx / 3) % 12;
    const chordIdx = (sectionIdx % 3) as 0 | 1 | 2;
    const nextChordIdx = ((sectionIdx + 1) % 3) as 0 | 1 | 2;
    const nextKeyIdx = Math.floor((sectionIdx + 1) / 3) % 12;

    const progression = this.chain[keyIdx];
    const nextProgression = this.chain[nextKeyIdx];

    this.drums(at);
    this.walkBass(
      at,
      pc(rootOf(progression, chordIdx)),
      pc(rootOf(nextProgression, nextChordIdx)),
      barInSection === chordBars - 1,
    );
    if (barInSection % 2 === 0) {
      const voicing = chordFreqs(progression.notes[chordIdx], 3);
      this.comp?.triggerAttackRelease(voicing, beat * 1.2, at(1));
      this.comp?.triggerAttackRelease(voicing, beat * 0.9, at(3));
    }

    for (let b = 0; b < 4; b++) cbs.onBeat(b, false);
    cbs.onSection({
      keyIdx,
      key: progression.key,
      chordIdx,
      progression,
      symbol: progression.symbols[chordIdx],
      barInSection,
      barsPerChord: chordBars,
      cycleLength: 12,
      isCountIn: false,
    });
  }

  private drums(at: (beats: number) => number): void {
    this.kick?.triggerAttackRelease('C1', 0.25, at(0));
    this.kick?.triggerAttackRelease('C1', 0.25, at(2));
    this.snare?.triggerAttackRelease(0.12, at(1));
    this.snare?.triggerAttackRelease(0.12, at(3));
    for (const b of SWING) {
      this.hat?.triggerAttackRelease(0.05, at(b));
    }
  }

  private walkBass(
    at: (beats: number) => number,
    rootPc: number,
    nextRootPc: number,
    approachNext: boolean,
  ): void {
    const third = (rootPc + 4) % 12;
    const fifth = (rootPc + 7) % 12;
    const approach = (nextRootPc - 1 + 12) % 12;
    const walk = approachNext ? [rootPc, third, fifth, approach] : [rootPc, fifth, third, fifth];
    walk.forEach((pitchClass, i) => {
      this.bass?.triggerAttackRelease(midiToFreq(36 + pitchClass), 0.4, at(i));
    });
  }
}

export const jamPlayer = new JamPlayer();
