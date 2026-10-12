import { circleOf, noteToString, pc, type CycleDirection, type NoteName } from '../../music/core';

interface CircleOfKeysProps {
  direction: CycleDirection;
  activeKey?: NoteName | null;
  targetKey?: NoteName | null;
  size?: number;
  labels?: boolean;
}

export function CircleOfKeys({
  direction,
  activeKey,
  targetKey,
  size = 260,
  labels = true,
}: CircleOfKeysProps) {
  const cycle = circleOf(direction);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 26;
  const activePc = activeKey ? pc(activeKey) : null;
  const targetPc = targetKey ? pc(targetKey) : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Círculo de ${direction === 'fourths' ? 'cuartas' : 'quintas'}`}
      className="h-auto w-full"
      style={{ maxWidth: size }}
    >
      <circle cx={cx} cy={cy} r={radius + 14} fill="var(--bg-light)" stroke="var(--border)" />
      <circle cx={cx} cy={cy} r={radius - 22} fill="var(--bg)" stroke="var(--border)" />
      {cycle.map((key, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const isActive = activePc !== null && pc(key) === activePc;
        const isTarget = targetPc !== null && pc(key) === targetPc;
        return (
          <g key={`${noteToString(key)}-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={17}
              fill={isActive ? 'var(--primary)' : isTarget ? 'var(--primary-soft)' : 'var(--bg)'}
              stroke={isActive || isTarget ? 'var(--primary)' : 'var(--border)'}
              strokeWidth={isActive || isTarget ? 2 : 1}
            />
            {labels && (
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={12}
                fontWeight={isActive ? 600 : 500}
                fill={isActive ? 'white' : 'var(--text)'}
                style={{ userSelect: 'none' }}
              >
                {noteToString(key)}
              </text>
            )}
          </g>
        );
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize={13}
        fill="var(--text-muted)"
        fontWeight={500}
      >
        {direction === 'fourths' ? 'Cuartas ↑' : 'Quintas ↑'}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
        12 tonalidades
      </text>
    </svg>
  );
}
