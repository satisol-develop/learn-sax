import { dayKey } from './habits';

export type RoutineKind = 'theory' | 'game' | 'jam';

export interface RoutineStep {
  id: string;
  kind: RoutineKind;
  resourceId: string;
  gameId: string;
  modeId?: string;
  title: string;
  detail: string;
  to: string;
}

/** Forma mínima que necesita la rutina (compatible con ResourceDef). */
export interface RoutineResource {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  jam?: boolean;
  modes: { id: string; name: string; description: string }[];
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG determinista para que la rutina del día sea estable entre renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plan de entrenamiento del día: teoría → dos juegos → jam.
 * Se deriva de la fecha, así que es igual durante todo el día y cambia cada día.
 */
export function buildRoutine(nowMs: number, resources: RoutineResource[]): RoutineStep[] {
  const withGames = resources.filter((r) => r.modes.length > 0);
  const jamResource = resources.find((r) => r.jam);
  if (withGames.length === 0) return [];

  const rand = mulberry32(hashString(dayKey(nowMs)));
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];

  const first = pick(withGames);
  const second = pick(withGames.filter((r) => r.id !== first.id));
  const target = second ?? first;
  const firstMode = pick(first.modes);
  const secondMode = pick(target.modes);

  const steps: RoutineStep[] = [
    {
      id: `theory:${first.id}`,
      kind: 'theory',
      resourceId: first.id,
      gameId: first.gameId,
      title: `Repasa ${first.title}`,
      detail: 'Lee la teoría con calma (2 min).',
      to: `/resource/${first.id}`,
    },
    {
      id: `game:${first.gameId}:${firstMode.id}`,
      kind: 'game',
      resourceId: first.id,
      gameId: first.gameId,
      modeId: firstMode.id,
      title: `${first.gameName} · ${firstMode.name}`,
      detail: firstMode.description,
      to: `/game/${first.gameId}/${firstMode.id}`,
    },
    {
      id: `game:${target.gameId}:${secondMode.id}`,
      kind: 'game',
      resourceId: target.id,
      gameId: target.gameId,
      modeId: secondMode.id,
      title: `${target.gameName} · ${secondMode.name}`,
      detail: secondMode.description,
      to: `/game/${target.gameId}/${secondMode.id}`,
    },
  ];

  if (jamResource) {
    steps.push({
      id: `jam:${jamResource.gameId}`,
      kind: 'jam',
      resourceId: jamResource.id,
      gameId: jamResource.gameId,
      title: 'Impro libre',
      detail: 'Toca encima del backing track por el ciclo.',
      to: `/game/${jamResource.gameId}/jam`,
    });
  }

  return steps;
}

export function routineProgress(steps: RoutineStep[], completed: string[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => completed.includes(step.id)).length;
  return Math.round((done / steps.length) * 100);
}
