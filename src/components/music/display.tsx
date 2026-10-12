import {
  noteToString,
  toWritten,
  type Instrument,
  type NoteName,
} from '../../music/core';
import { useProgress } from '../../progress/store';
import { ensureAudio, playChord, playChordSequence, playNotes } from '../../audio/engine';

export function useInstrument(): Instrument {
  return useProgress((s) => s.settings.instrument);
}

export function usePitchMode() {
  return useProgress((s) => s.settings.pitchMode);
}

interface NoteTextProps {
  note: NoteName;
  showWritten?: boolean;
  className?: string;
}

export function NoteText({ note, showWritten, className = '' }: NoteTextProps) {
  const instrument = useInstrument();
  const pitchMode = usePitchMode();
  const show = showWritten ?? pitchMode === 'transposed';
  if (!show) return <span className={className}>{noteToString(note)}</span>;
  const written = toWritten(note, instrument);
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span>{noteToString(note)}</span>
      <span className="text-[0.7em] text-ink-muted" title="En tu saxofón">
        [{noteToString(written)}]
      </span>
    </span>
  );
}

export function KeyText({ note, className = '' }: { note: NoteName; className?: string }) {
  return <NoteText note={note} showWritten={false} className={className} />;
}

export function usePlayNotes() {
  return async (freqs: number[], noteDur = 0.32, gap = 0.06) => {
    await ensureAudio();
    playNotes(freqs, noteDur, gap);
  };
}

export function usePlayChord() {
  return async (freqs: number[], dur = 1.2) => {
    await ensureAudio();
    playChord(freqs, dur);
  };
}

export function usePlayChords() {
  return async (chords: number[][], dur = 0.9, gap = 0.05) => {
    await ensureAudio();
    playChordSequence(chords, dur, gap);
  };
}
