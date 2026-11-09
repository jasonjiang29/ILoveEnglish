import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';
import type { ReviewLog, ReviewRecord } from '../db/types';

export type RatingChoice = 'again' | 'hard' | 'good';

export interface ScheduleResult {
  review: ReviewRecord;
  log: Omit<ReviewLog, 'id'>;
}

const scheduler = fsrs();

const RATING_MAP: Record<RatingChoice, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
};

function recordToCard(record: ReviewRecord): Card {
  return {
    due: new Date(record.dueAt),
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsedDays,
    scheduled_days: record.scheduledDays,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state,
    last_review: record.lastReviewAt ? new Date(record.lastReviewAt) : undefined,
  };
}

export function scheduleReview(
  wordId: string,
  existing: ReviewRecord | undefined,
  choice: RatingChoice,
  now: Date = new Date(),
): ScheduleResult {
  const card = existing ? recordToCard(existing) : createEmptyCard(now);
  const { card: next, log } = scheduler.next(card, now, RATING_MAP[choice]);
  const dueAt = Math.max(next.due.getTime(), now.getTime());

  return {
    review: {
      wordId,
      dueAt,
      stability: next.stability,
      difficulty: next.difficulty,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      lastReviewAt: now.getTime(),
      scheduledDays: next.scheduled_days,
      elapsedDays: next.elapsed_days,
    },
    log: {
      wordId,
      rating: log.rating,
      reviewedAt: now.getTime(),
      elapsedDays: log.elapsed_days,
      scheduledDays: log.scheduled_days,
    },
  };
}
