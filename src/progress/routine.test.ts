import { describe, expect, it } from 'vitest';
import { buildRoutine, routineProgress, type RoutineResource } from './routine';

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();

const res = (
  id: string,
  gameId: string,
  opts: { jam?: boolean; modes?: string[] } = {},
): RoutineResource => ({
  id,
  title: id,
  gameId,
  gameName: `juego ${id}`,
  jam: opts.jam,
  modes: (opts.modes ?? ['a', 'b']).map((m) => ({
    id: m,
    name: `modo ${m}`,
    description: `desc ${m}`,
  })),
});

const RESOURCES: RoutineResource[] = [
  res('escalas', 'scale-sprint', { modes: ['ordena', 'siguiente'] }),
  res('circulo', 'circle-orbit', { modes: ['cuartas', 'quintas'] }),
  res('cuatriadas', 'chord-builder', { modes: ['construye', 'simbolo'] }),
  res('impro', 'jam-cycle', { jam: true, modes: [] }),
];

describe('buildRoutine', () => {
  it('returns theory, two games and a jam step', () => {
    const steps = buildRoutine(at(12), RESOURCES);
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.kind)).toEqual(['theory', 'game', 'game', 'jam']);
  });

  it('is deterministic within the same day', () => {
    expect(buildRoutine(at(12, 1), RESOURCES)).toEqual(buildRoutine(at(12, 23), RESOURCES));
  });

  it('rotates the plan across days', () => {
    const firstTitles = new Set(
      Array.from({ length: 30 }, (_, i) => buildRoutine(at(i + 1), RESOURCES)[0].title),
    );
    expect(firstTitles.size).toBeGreaterThan(1);
  });

  it('keeps unique step ids and valid routes', () => {
    const steps = buildRoutine(at(12), RESOURCES);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const step of steps) {
      expect(step.to.startsWith('/game/') || step.to.startsWith('/resource/')).toBe(true);
    }
    expect(steps[0].to).toBe(`/resource/${steps[0].resourceId}`);
    expect(steps[3].to).toBe('/game/jam-cycle/jam');
  });

  it('uses two distinct game resources', () => {
    const steps = buildRoutine(at(12), RESOURCES);
    expect(steps[1].resourceId).not.toBe(steps[2].resourceId);
  });

  it('drops the jam step when no jam resource exists', () => {
    const steps = buildRoutine(at(12), RESOURCES.filter((r) => !r.jam));
    expect(steps).toHaveLength(3);
    expect(steps.every((s) => s.kind !== 'jam')).toBe(true);
  });

  it('returns an empty plan without game resources', () => {
    expect(buildRoutine(at(12), [res('impro', 'jam-cycle', { jam: true, modes: [] })])).toEqual([]);
  });
});

describe('routineProgress', () => {
  const steps = buildRoutine(at(12), RESOURCES);

  it('is 0 with nothing done', () => {
    expect(routineProgress(steps, [])).toBe(0);
  });

  it('is 50% with half done', () => {
    expect(routineProgress(steps, [steps[0].id, steps[1].id])).toBe(50);
  });

  it('is 100% when all done', () => {
    expect(routineProgress(steps, steps.map((s) => s.id))).toBe(100);
  });

  it('handles an empty plan', () => {
    expect(routineProgress([], ['x'])).toBe(0);
  });
});
