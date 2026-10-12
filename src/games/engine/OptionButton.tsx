import type { ReactNode } from 'react';

interface OptionButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  state?: 'default' | 'selected' | 'correct' | 'wrong';
  className?: string;
}

const stateStyles: Record<NonNullable<OptionButtonProps['state']>, string> = {
  default: 'bg-app-light border-line hover:border-sheen text-ink',
  selected: 'bg-primary-soft border-primary text-primary',
  correct: 'bg-success/15 border-success text-success',
  wrong: 'bg-danger/15 border-danger text-danger',
};

export function OptionButton({
  children,
  onClick,
  disabled = false,
  state = 'default',
  className = '',
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 rounded-2xl border px-4 py-3 text-center text-base font-semibold transition-colors focus-ring disabled:opacity-60 ${stateStyles[state]} ${className}`}
    >
      {children}
    </button>
  );
}

export function OptionGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const grid =
    cols === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : cols === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2';
  return <div className={`grid gap-3 ${grid}`}>{children}</div>;
}
