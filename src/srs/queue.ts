import type { Word } from '../data/types';
import type { ReviewRecord } from '../db/types';

export interface QueueOptions {
  now?: Date;
  dailyNewLimit: number;
  newIntroducedToday?: number;
}

export interface QueueItem {
  word: Word;
  review?: ReviewRecord;
  isNew: boolean;
}

export function buildQueue(
  words: Word[],
  reviews: ReviewRecord[],
  options: QueueOptions,
): QueueItem[] {
  const nowMs = (options.now ?? new Date()).getTime();
  const byId = new Map(words.map((word) => [word.id, word]));
  const reviewedIds = new Set(reviews.map((review) => review.wordId));

  const due = reviews.filter((review) => review.dueAt <= nowMs).sort((a, b) => a.dueAt - b.dueAt);

  const remainingNew = Math.max(
    0,
    options.dailyNewLimit - Math.max(0, options.newIntroducedToday ?? 0),
  );

  const newWords = words
    .filter((word) => !reviewedIds.has(word.id))
    .sort(
      (a, b) =>
        (a.frequencyRank ?? Number.MAX_SAFE_INTEGER) - (b.frequencyRank ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, remainingNew);

  const seen = new Set<string>();
  const queue: QueueItem[] = [];

  for (const review of due) {
    const word = byId.get(review.wordId);
    if (word && !seen.has(word.id)) {
      seen.add(word.id);
      queue.push({ word, review, isNew: false });
    }
  }

  for (const word of newWords) {
    if (!seen.has(word.id)) {
      seen.add(word.id);
      queue.push({ word, isNew: true });
    }
  }

  return queue;
}
