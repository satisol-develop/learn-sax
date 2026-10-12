import { describe, expect, it } from 'vitest';
import {
  ALL_KEYS,
  buildChord,
  chordSymbol,
  cycleFrom,
  DIATONIC_MAJOR,
  DIATONIC_MINOR,
  iiViChain,
  iiViIn,
  keySpelling,
  majorScale,
  naturalMinor,
  bluesProgressionIn,
  bluesScale,
  modeScale,
  nextInCycle,
  noteToString,
  pc,
  pentatonicMajor,
  SCALE_TYPES,
  scaleFromSteps,
  toConcert,
  toWritten,
  n,
} from './core';

const names = (notes: { letter: string; accidental: number }[]) =>
  notes
    .map((note) => {
      const acc =
        note.accidental === 0 ? '' : note.accidental === 1 ? '#' : note.accidental === -1 ? 'b' : note.accidental === 2 ? '##' : 'bb';
      return note.letter + acc;
    })
    .join(' ');

describe('majorScale spelling', () => {
  it('spells Bb major correctly', () => {
    expect(names(majorScale(n('B', -1)))).toBe('Bb C D Eb F G A');
  });

  it('spells Eb major correctly', () => {
    expect(names(majorScale(n('E', -1)))).toBe('Eb F G Ab Bb C D');
  });

  it('spells Gb major with Cb', () => {
    expect(names(majorScale(n('G', -1)))).toBe('Gb Ab Bb Cb Db Eb F');
  });

  it('spells F# major correctly', () => {
    expect(names(majorScale(n('F', 1)))).toBe('F# G# A# B C# D# E#');
  });

  it('spells C major with no accidentals', () => {
    expect(names(majorScale(n('C')))).toBe('C D E F G A B');
  });
});

describe('naturalMinor spelling', () => {
  it('spells A minor with no accidentals', () => {
    expect(names(naturalMinor(n('A')))).toBe('A B C D E F G');
  });

  it('spells D minor with Bb', () => {
    expect(names(naturalMinor(n('D')))).toBe('D E F G A Bb C');
  });

  it('spells E minor with F#', () => {
    expect(names(naturalMinor(n('E')))).toBe('E F# G A B C D');
  });

  it('spells F minor with flats', () => {
    expect(names(naturalMinor(n('F')))).toBe('F G Ab Bb C Db Eb');
  });

  it('spells Eb minor with Cb', () => {
    expect(names(naturalMinor(n('E', -1)))).toBe('Eb F Gb Ab Bb Cb Db');
  });

  it('spells B minor correctly', () => {
    expect(names(naturalMinor(n('B')))).toBe('B C# D E F# G A');
  });
});

describe('diatonic chords', () => {
  it('IV of C major is Fmaj7', () => {
    const root = majorScale(n('C'))[3];
    expect(chordSymbol(root, DIATONIC_MAJOR[3])).toBe('Fmaj7');
  });

  it('ii of A minor is Bm7b5', () => {
    const root = naturalMinor(n('A'))[1];
    expect(chordSymbol(root, DIATONIC_MINOR[1])).toBe('Bm7♭5');
  });

  it('v of D minor is Am7 (natural minor)', () => {
    const root = naturalMinor(n('D'))[4];
    expect(chordSymbol(root, DIATONIC_MINOR[4])).toBe('Am7');
  });

  it('vii of C major is Bm7b5', () => {
    const root = majorScale(n('C'))[6];
    expect(chordSymbol(root, DIATONIC_MAJOR[6])).toBe('Bm7♭5');
  });
});

describe('circle', () => {
  it('circle of fourths follows jazz order', () => {
    const cycle = cycleFrom(n('C'), 'fourths').map(noteToString);
    expect(cycle).toEqual(['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G']);
  });

  it('circle of fifths is the reverse order of fourths', () => {
    const fifths = cycleFrom(n('C'), 'fifths').map(noteToString);
    expect(fifths).toEqual(['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']);
  });

  it('nextInCycle moves a perfect fourth up', () => {
    expect(noteToString(nextInCycle(n('C'), 'fourths'))).toBe('F');
    expect(noteToString(nextInCycle(n('B', -1), 'fourths'))).toBe('Eb');
    expect(noteToString(nextInCycle(n('G'), 'fourths'))).toBe('C');
  });

  it('keySpelling uses Gb on fourths and F# on fifths', () => {
    expect(noteToString(keySpelling(6, 'fourths'))).toBe('Gb');
    expect(noteToString(keySpelling(6, 'fifths'))).toBe('F#');
  });
});

describe('chords', () => {
  it('builds Cmaj7', () => {
    expect(names(buildChord(n('C'), 'maj7'))).toBe('C E G B');
  });

  it('builds Dm7', () => {
    expect(names(buildChord(n('D'), 'm7'))).toBe('D F A C');
  });

  it('builds G7', () => {
    expect(names(buildChord(n('G'), '7'))).toBe('G B D F');
  });

  it('builds Bbmaj7', () => {
    expect(names(buildChord(n('B', -1), 'maj7'))).toBe('Bb D F A');
  });

  it('builds C#m7b5 with correct spelling', () => {
    expect(names(buildChord(n('C', 1), 'm7b5'))).toBe('C# E G B');
  });

  it('builds dim7 with double flat VII', () => {
    expect(names(buildChord(n('C'), 'dim7'))).toBe('C Eb Gb Bbb');
  });

  it('symbols render with suffixes', () => {
    expect(chordSymbol(n('D'), 'm7')).toBe('Dm7');
    expect(chordSymbol(n('G'), '7')).toBe('G7');
    expect(chordSymbol(n('C'), 'maj7')).toBe('Cmaj7');
    expect(chordSymbol(n('B'), 'm7b5')).toBe('Bm7♭5');
  });
});

describe('ii-V-I', () => {
  it('ii-V-I in C is Dm7 G7 Cmaj7', () => {
    const p = iiViIn(n('C'));
    expect(p.symbols).toEqual(['Dm7', 'G7', 'Cmaj7']);
  });

  it('ii-V-I in Bb is Cm7 F7 Bbmaj7', () => {
    const p = iiViIn(n('B', -1));
    expect(p.symbols).toEqual(['Cm7', 'F7', 'Bbmaj7']);
  });

  it('ii of B major is C#', () => {
    const p = iiViIn(n('B'));
    expect(noteToString(p.ii)).toBe('C#');
    expect(noteToString(p.V)).toBe('F#');
  });

  it('chains two links through fourths', () => {
    const chain = iiViChain(n('C'), 'fourths', 2);
    expect(chain[0].symbols).toEqual(['Dm7', 'G7', 'Cmaj7']);
    expect(chain[1].symbols).toEqual(['Gm7', 'C7', 'Fmaj7']);
  });
});

describe('transposition', () => {
  it('concert C is written A on alto', () => {
    expect(noteToString(toWritten(n('C'), 'alto'))).toBe('A');
  });

  it('concert C is written D on tenor and soprano', () => {
    expect(noteToString(toWritten(n('C'), 'tenor'))).toBe('D');
    expect(noteToString(toWritten(n('C'), 'soprano'))).toBe('D');
  });

  it('concert Bb is written G on alto', () => {
    expect(noteToString(toWritten(n('B', -1), 'alto'))).toBe('G');
  });

  it('written A on alto reads back to concert C', () => {
    expect(noteToString(toConcert(n('A'), 'alto'))).toBe('C');
  });

  it('written D on tenor reads back to concert C', () => {
    expect(noteToString(toConcert(n('D'), 'tenor'))).toBe('C');
  });

  it('toConcert is the inverse of toWritten across all keys', () => {
    for (const key of ALL_KEYS) {
      for (const inst of ['soprano', 'alto', 'tenor'] as const) {
        expect(noteToString(toConcert(toWritten(key, inst), inst))).toBe(noteToString(key));
      }
    }
  });
});

describe('keys', () => {
  it('has 12 spellings', () => {
    expect(ALL_KEYS).toHaveLength(12);
  });
});

describe('modes', () => {
  it('D dorian is D E F G A B C', () => {
    expect(names(modeScale(n('D'), 'dorian'))).toBe('D E F G A B C');
  });

  it('G mixolydian is G A B C D E F', () => {
    expect(names(modeScale(n('G'), 'mixolydian'))).toBe('G A B C D E F');
  });

  it('F lydian is F G A B C D E', () => {
    expect(names(modeScale(n('F'), 'lydian'))).toBe('F G A B C D E');
  });

  it('E phrygian is E F G A B C D', () => {
    expect(names(modeScale(n('E'), 'phrygian'))).toBe('E F G A B C D');
  });

  it('B locrian is B C D E F G A', () => {
    expect(names(modeScale(n('B'), 'locrian'))).toBe('B C D E F G A');
  });

  it('ionian matches major and aeolian matches natural minor', () => {
    expect(names(modeScale(n('E', -1), 'ionian'))).toBe(names(majorScale(n('E', -1))));
    expect(names(modeScale(n('B', -1), 'aeolian'))).toBe(names(naturalMinor(n('B', -1))));
  });

  it('every mode on its degree of C major shares the same notes', () => {
    const parent = new Set(majorScale(n('C')).map(pc).sort((a, b) => a - b));
    const expected = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'] as const;
    expected.forEach((mode, degree) => {
      const tonic = majorScale(n('C'))[degree];
      const pcs = modeScale(tonic, mode).map(pc).sort((a, b) => a - b);
      expect(new Set(pcs)).toEqual(parent);
    });
  });
});

describe('pentatonic and blues', () => {
  it('C major pentatonic is C D E G A', () => {
    expect(names(pentatonicMajor(n('C')))).toBe('C D E G A');
  });

  it('A blues is A C D Eb E G', () => {
    expect(names(bluesScale(n('A')))).toBe('A C D Eb E G');
  });

  it('C blues is C Eb F Gb G Bb', () => {
    expect(names(bluesScale(n('C')))).toBe('C Eb F Gb G Bb');
  });
});

describe('scale registry', () => {
  it('exposes 9 scale types with unique ids', () => {
    expect(SCALE_TYPES).toHaveLength(9);
    expect(new Set(SCALE_TYPES.map((t) => t.id)).size).toBe(SCALE_TYPES.length);
  });

  it('every type builds a valid scale from any natural tonic', () => {
    for (const type of SCALE_TYPES) {
      const scale = type.build(n('A'));
      expect(scale.length).toBeGreaterThanOrEqual(5);
      expect(pc(scale[0])).toBe(9);
    }
  });

  it('scaleFromSteps powers the major scale', () => {
    expect(names(scaleFromSteps(n('D'), [0, 2, 4, 5, 7, 9, 11]))).toBe('D E F# G A B C#');
  });
});

describe('blues form', () => {
  it('has 12 bars', () => {
    expect(bluesProgressionIn(n('C'))).toHaveLength(12);
  });

  it('spells a C blues with the right chords per bar', () => {
    expect(bluesProgressionIn(n('C')).map((bar) => bar.symbol)).toEqual([
      'C7',
      'C7',
      'C7',
      'C7',
      'F7',
      'F7',
      'C7',
      'C7',
      'G7',
      'F7',
      'C7',
      'G7',
    ]);
  });

  it('transposes the blues to Bb', () => {
    expect(bluesProgressionIn(n('B', -1)).slice(0, 5).map((bar) => bar.symbol)).toEqual([
      'Bb7',
      'Bb7',
      'Bb7',
      'Bb7',
      'Eb7',
    ]);
  });

  it('degrees match the classic form', () => {
    expect(bluesProgressionIn(n('F')).map((bar) => bar.degree)).toEqual([
      0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4,
    ]);
  });
});
