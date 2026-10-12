import { Play } from 'lucide-react';
import {
  noteToString,
  toWritten,
  type Instrument,
  type NoteName,
} from '../../music/core';
import { useProgress } from '../../progress/store';
import { ensureAudio, playChord, playNote, playNotes } from '../../audio/engine';

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

export function usePlayNote() {
  return async (freq: number, dur = 0.5) => {
    await ensureAudio();
    playNote(freq, dur);
  };
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

export function PlayButton({
  onClick,
  label = 'Escuchar',
  size = 'md',
  className = '',
}: {
  onClick: () => void | Promise<void>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dims =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
        ? 'h-12 w-12'
        : 'h-10 w-10';
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full bg-primary-soft text-primary border border-primary/30 hover:bg-primary hover:text-white transition-colors focus-ring ${dims} ${className}`}
    >
      <Play size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} fill="currentColor" />
    </button>
  );
}
