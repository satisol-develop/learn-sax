export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface NoteName {
  letter: Letter;
  accidental: Accidental;
}

export const NATURAL_PC: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pcOf(letter: Letter, accidental: Accidental): number {
  return (NATURAL_PC[letter] + accidental + 120) % 12;
}

export function pc(note: NoteName): number {
  return pcOf(note.letter, note.accidental);
}

export function accFromDelta(delta: number): Accidental {
  const d = ((delta % 12) + 12) % 12;
  if (d <= 2) return d as Accidental;
  return (d - 12) as Accidental;
}

export function noteToString(note: NoteName): string {
  const acc =
    note.accidental === 0
      ? ''
      : note.accidental === 1
        ? '#'
        : note.accidental === 2
          ? '##'
          : note.accidental === -1
            ? 'b'
            : 'bb';
  return note.letter + acc;
}

export function noteEq(a: NoteName, b: NoteName): boolean {
  return pc(a) === pc(b);
}

export const n = (letter: Letter, accidental: Accidental = 0): NoteName => ({ letter, accidental });

export const KEY_SPELLINGS: NoteName[] = [
  n('C'),
  n('D', -1),
  n('D'),
  n('E', -1),
  n('E'),
  n('F'),
  n('F', 1),
  n('G'),
  n('A', -1),
  n('A'),
  n('B', -1),
  n('B'),
];

export function keySpelling(pitchClass: number, direction: 'fourths' | 'fifths' = 'fourths'): NoteName {
  const pcv = ((pitchClass % 12) + 12) % 12;
  if (pcv === 6) return direction === 'fourths' ? n('G', -1) : n('F', 1);
  return KEY_SPELLINGS[pcv];
}

const CIRCLE_FOURTHS_PCS = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
const CIRCLE_FIFTHS_PCS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export const CIRCLE_OF_FOURTHS: NoteName[] = CIRCLE_FOURTHS_PCS.map((p) =>
  keySpelling(p, 'fourths'),
);
export const CIRCLE_OF_FIFTHS: NoteName[] = CIRCLE_FIFTHS_PCS.map((p) => keySpelling(p, 'fifths'));

export type CycleDirection = 'fourths' | 'fifths';

export function circleOf(direction: CycleDirection): NoteName[] {
  return direction === 'fourths' ? CIRCLE_OF_FOURTHS : CIRCLE_OF_FIFTHS;
}

export function circleIndex(from: NoteName, direction: CycleDirection): number {
  const cycle = circleOf(direction);
  return cycle.findIndex((k) => pc(k) === pc(from));
}

export function nextInCycle(
  from: NoteName,
  direction: CycleDirection,
  steps = 1,
): NoteName {
  const cycle = circleOf(direction);
  const idx = circleIndex(from, direction);
  return cycle[((idx + steps) % 12 + 12) % 12];
}

export function cycleFrom(
  start: NoteName,
  direction: CycleDirection,
): NoteName[] {
  const idx = circleIndex(start, direction);
  const cycle = circleOf(direction);
  return [...cycle.slice(idx), ...cycle.slice(0, idx)];
}

export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11] as const;
export const NATURAL_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10] as const;

/** Escala con una letra por grado: ortografía correcta desde la tónica. */
export function scaleFromSteps(tonic: NoteName, steps: readonly number[]): NoteName[] {
  const startIdx = LETTERS.indexOf(tonic.letter);
  const tonicPc = pc(tonic);
  return steps.map((step, i) => {
    const letter = LETTERS[(startIdx + i) % 7];
    const target = (tonicPc + step) % 12;
    const delta = (target - NATURAL_PC[letter] + 12) % 12;
    return { letter, accidental: accFromDelta(delta) };
  });
}

export function majorScale(tonic: NoteName): NoteName[] {
  return scaleFromSteps(tonic, MAJOR_STEPS);
}

export function naturalMinor(tonic: NoteName): NoteName[] {
  return scaleFromSteps(tonic, NATURAL_MINOR_STEPS);
}

export type ModeName =
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian';

/** Los 7 modos de la escala mayor como patrones de intervalos desde la tónica. */
export const MODE_STEPS: Record<ModeName, readonly number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

export function modeScale(tonic: NoteName, mode: ModeName): NoteName[] {
  return scaleFromSteps(tonic, MODE_STEPS[mode]);
}

export function pentatonicMajor(tonic: NoteName): NoteName[] {
  const scale = majorScale(tonic);
  return [0, 1, 2, 4, 5].map((degree) => scale[degree]);
}

/** Pentatónica menor + ♭5, la escala del blues. */
export function bluesScale(tonic: NoteName): NoteName[] {
  const minor = naturalMinor(tonic);
  const pent = [0, 2, 3, 4, 6].map((degree) => minor[degree]);
  const fifth = minor[4];
  const flatFifth: NoteName = {
    letter: fifth.letter,
    accidental: (fifth.accidental - 1) as Accidental,
  };
  return [pent[0], pent[1], pent[2], flatFifth, pent[3], pent[4]];
}

export interface ScaleTypeDef {
  id: string;
  label: string;
  build: (tonic: NoteName) => NoteName[];
}

/** Todas las escalas que la app sabe construir: modos, pentatónica y blues. */
export const SCALE_TYPES: ScaleTypeDef[] = [
  { id: 'ionian', label: 'Jónico (mayor)', build: (tonic) => modeScale(tonic, 'ionian') },
  { id: 'dorian', label: 'Dórico', build: (tonic) => modeScale(tonic, 'dorian') },
  { id: 'phrygian', label: 'Frigio', build: (tonic) => modeScale(tonic, 'phrygian') },
  { id: 'lydian', label: 'Lidio', build: (tonic) => modeScale(tonic, 'lydian') },
  { id: 'mixolydian', label: 'Mixolidio', build: (tonic) => modeScale(tonic, 'mixolydian') },
  { id: 'aeolian', label: 'Eólico (menor natural)', build: (tonic) => modeScale(tonic, 'aeolian') },
  { id: 'locrian', label: 'Locrio', build: (tonic) => modeScale(tonic, 'locrian') },
  { id: 'pentatonic', label: 'Pentatónica mayor', build: pentatonicMajor },
  { id: 'blues', label: 'Blues', build: bluesScale },
];

export function scaleTypeById(id: string): ScaleTypeDef | undefined {
  return SCALE_TYPES.find((type) => type.id === id);
}

export type ChordQuality = 'maj7' | 'm7' | '7' | 'm7b5' | 'dim7';

export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
};

export const CHORD_SUFFIX: Record<ChordQuality, string> = {
  maj7: 'maj7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7♭5',
  dim7: '°7',
};

export const CHORD_LABELS: Record<ChordQuality, string> = {
  maj7: 'mayor 7ª',
  m7: 'menor 7ª',
  '7': 'dominante 7ª',
  m7b5: 'semidisminuida',
  dim7: 'disminuida',
};

export function buildChord(root: NoteName, quality: ChordQuality): NoteName[] {
  const startIdx = LETTERS.indexOf(root.letter);
  const rootPc = pc(root);
  return CHORD_INTERVALS[quality].map((step, i) => {
    const letter = LETTERS[(startIdx + 2 * i) % 7];
    const target = (rootPc + step) % 12;
    const delta = (target - NATURAL_PC[letter] + 12) % 12;
    return { letter, accidental: accFromDelta(delta) };
  });
}

export function chordSymbol(root: NoteName, quality: ChordQuality): string {
  return noteToString(root) + CHORD_SUFFIX[quality];
}

export const DIATONIC_MAJOR: ChordQuality[] = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];

export const DIATONIC_MINOR: ChordQuality[] = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];

export interface IIviProgression {
  key: NoteName;
  ii: NoteName;
  V: NoteName;
  I: NoteName;
  symbols: [string, string, string];
  notes: [NoteName[], NoteName[], NoteName[]];
}

export function iiViIn(key: NoteName): IIviProgression {
  const scale = majorScale(key);
  const ii = scale[1];
  const V = scale[4];
  return {
    key,
    ii,
    V,
    I: key,
    symbols: [chordSymbol(ii, 'm7'), chordSymbol(V, '7'), chordSymbol(key, 'maj7')],
    notes: [buildChord(ii, 'm7'), buildChord(V, '7'), buildChord(key, 'maj7')],
  };
}

export const BLUES_DEGREES = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4] as const;
export type BluesDegree = 0 | 3 | 4;

export interface BluesBar {
  degree: BluesDegree;
  root: NoteName;
  symbol: string;
  notes: NoteName[];
}

/** Blues de 12 compases en clave mayor: I7 en los primeros, IV7 y V7 según la forma. */
export function bluesProgressionIn(key: NoteName): BluesBar[] {
  const scale = majorScale(key);
  return BLUES_DEGREES.map((degree) => {
    const root = scale[degree];
    return { degree, root, symbol: chordSymbol(root, '7'), notes: buildChord(root, '7') };
  });
}

export function iiViChain(start: NoteName, direction: CycleDirection, links: number): IIviProgression[] {
  const out: IIviProgression[] = [];
  let current = start;
  for (let i = 0; i < links; i++) {
    out.push(iiViIn(current));
    current = nextInCycle(current, direction);
  }
  return out;
}

export type Instrument = 'soprano' | 'alto' | 'tenor';

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  soprano: 'Soprano (Si♭)',
  alto: 'Alto (Mi♭)',
  tenor: 'Tenor (Si♭)',
};

export const INSTRUMENT_OFFSET: Record<Instrument, number> = {
  soprano: 14,
  alto: 9,
  tenor: 14,
};

export function toWritten(concert: NoteName, instrument: Instrument): NoteName {
  const writtenPc = (pc(concert) + INSTRUMENT_OFFSET[instrument]) % 12;
  return KEY_SPELLINGS[writtenPc];
}

export function toConcert(written: NoteName, instrument: Instrument): NoteName {
  const concertPc = (pc(written) - INSTRUMENT_OFFSET[instrument] + 120) % 12;
  return KEY_SPELLINGS[concertPc];
}

export function midiOf(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + pc(note);
}

export function freqOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteFreq(note: NoteName, octave: number): number {
  return freqOf(midiOf(note, octave));
}

export function scaleFreqs(scale: NoteName[], startOctave: number, ascending = true): number[] {
  const base = scale.map((note) => noteFreq(note, startOctave));
  const top = noteFreq(scale[0], startOctave + 1);
  return ascending ? [...base, top] : [top, ...[...base].reverse()];
}

export function chordFreqs(notes: NoteName[], octave: number): number[] {
  return notes.map((note, i) => noteFreq(note, i > 0 && pc(note) < pc(notes[0]) ? octave + 1 : octave));
}

export const ALL_KEYS: NoteName[] = KEY_SPELLINGS;
