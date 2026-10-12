const DAY_MS = 86_400_000;

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function localMidnight(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayDiff(fromMs: number, toMs: number): number {
  return Math.round((localMidnight(toMs) - localMidnight(fromMs)) / DAY_MS);
}

export function advanceStreak(
  prevStreak: number,
  lastMs: number | null,
  nowMs: number,
): number {
  if (lastMs === null) return 1;
  const diff = dayDiff(lastMs, nowMs);
  if (diff <= 0) return Math.max(prevStreak, 1);
  if (diff === 1) return prevStreak + 1;
  return 1;
}

export function pushDay(days: string[], key: string, cap = 60): string[] {
  if (days.includes(key)) return days;
  return [...days, key].slice(-cap);
}

export function lastNDates(nowMs: number, count: number): Date[] {
  const today = localMidnight(nowMs);
  const dates: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(new Date(today - i * DAY_MS));
  }
  return dates;
}

export const WEEKDAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

export function hasPracticedOn(days: string[], ms: number): boolean {
  return days.includes(dayKey(ms));
}

export interface DayMark {
  key: string;
  letter: string;
  done: boolean;
  isToday: boolean;
}

/** Últimos `count` días (más antiguo primero) con su estado de repaso. */
export function weekOverview(days: string[], nowMs: number, count = 7): DayMark[] {
  const todayKey = dayKey(nowMs);
  return lastNDates(nowMs, count).map((date) => {
    const key = dayKey(date.getTime());
    return {
      key,
      letter: WEEKDAY_LETTERS[date.getDay()],
      done: days.includes(key),
      isToday: key === todayKey,
    };
  });
}
