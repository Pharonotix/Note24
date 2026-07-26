/** Review-interval ladder, in days: 1 day, 3 days, 1 week, 2 weeks, 1 month. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30]

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Advances a card's schedule after a review. A correct answer moves one step up the
 * interval ladder (capping at the longest interval); a miss resets to the first step.
 */
export function nextSchedule(
  intervalIdx: number,
  correct: boolean,
  now = Date.now()
): { intervalIdx: number; dueAt: number } {
  const idx = correct
    ? Math.min(intervalIdx + 1, REVIEW_INTERVALS_DAYS.length - 1)
    : 0
  return { intervalIdx: idx, dueAt: now + REVIEW_INTERVALS_DAYS[idx] * DAY_MS }
}

export function isDue(dueAt: number, now = Date.now()): boolean {
  return dueAt <= now
}
