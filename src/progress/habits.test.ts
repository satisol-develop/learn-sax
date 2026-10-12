import { describe, expect, it } from 'vitest';
import {
  advanceStreak,
  dayDiff,
  dayKey,
  hasPracticedOn,
  lastNDates,
  pushDay,
  weekOverview,
} from './habits';

const at = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour).getTime();

describe('dayKey', () => {
  it('formats as local YYYY-MM-DD', () => {
    expect(dayKey(at(2026, 10, 12))).toBe('2026-10-12');
  });

  it('pads month and day', () => {
    expect(dayKey(at(2026, 1, 5))).toBe('2026-01-05');
  });
});

describe('dayDiff', () => {
  it('is 0 within the same day', () => {
    expect(dayDiff(at(2026, 10, 12, 1), at(2026, 10, 12, 23))).toBe(0);
  });

  it('counts calendar days', () => {
    expect(dayDiff(at(2026, 10, 10), at(2026, 10, 12))).toBe(2);
    expect(dayDiff(at(2026, 10, 12, 23), at(2026, 10, 13, 1))).toBe(1);
  });
});

describe('advanceStreak', () => {
  it('starts at 1 on first practice', () => {
    expect(advanceStreak(0, null, at(2026, 10, 12))).toBe(1);
  });

  it('keeps the streak on the same day', () => {
    expect(advanceStreak(5, at(2026, 10, 12, 9), at(2026, 10, 12, 21))).toBe(5);
  });

  it('increments on consecutive days', () => {
    expect(advanceStreak(5, at(2026, 10, 11, 23), at(2026, 10, 12, 0))).toBe(6);
  });

  it('resets to 1 after a gap', () => {
    expect(advanceStreak(5, at(2026, 10, 9), at(2026, 10, 12))).toBe(1);
  });
});

describe('pushDay', () => {
  it('appends new days', () => {
    const days = pushDay(['2026-10-10'], '2026-10-11');
    expect(days).toEqual(['2026-10-10', '2026-10-11']);
  });

  it('dedupes repeated days', () => {
    const days = ['2026-10-10', '2026-10-11'];
    expect(pushDay(days, '2026-10-11')).toEqual(days);
  });

  it('caps the history keeping the newest', () => {
    let days: string[] = [];
    for (let i = 1; i <= 5; i++) days = pushDay(days, dayKey(at(2026, 10, i)), 3);
    expect(days).toEqual(['2026-10-03', '2026-10-04', '2026-10-05']);
  });
});

describe('lastNDates', () => {
  it('returns consecutive days ending today', () => {
    const dates = lastNDates(at(2026, 10, 12), 7);
    expect(dates).toHaveLength(7);
    expect(dayKey(dates[6].getTime())).toBe('2026-10-12');
    expect(dayKey(dates[0].getTime())).toBe('2026-10-06');
    expect(dayDiff(dates[0].getTime(), dates[6].getTime())).toBe(6);
  });
});

describe('hasPracticedOn', () => {
  it('is true when the day is in the history', () => {
    expect(hasPracticedOn(['2026-10-12'], at(2026, 10, 12, 23))).toBe(true);
  });

  it('is false on a fresh day', () => {
    expect(hasPracticedOn(['2026-10-11'], at(2026, 10, 12, 1))).toBe(false);
  });
});

describe('weekOverview', () => {
  it('maps the last 7 days oldest to newest', () => {
    const marks = weekOverview(['2026-10-12', '2026-10-10'], at(2026, 10, 12));
    expect(marks).toHaveLength(7);
    expect(marks[0].key).toBe('2026-10-06');
    expect(marks[6].isToday).toBe(true);
    expect(marks[6].key).toBe('2026-10-12');
    expect(marks[6].done).toBe(true);
    expect(marks[4].key).toBe('2026-10-10');
    expect(marks[4].done).toBe(true);
    expect(marks[5].done).toBe(false);
  });

  it('labels days with weekday letters (Monday 2026-10-12 = L)', () => {
    const marks = weekOverview([], at(2026, 10, 12));
    expect(marks[6].letter).toBe('L');
  });
});
