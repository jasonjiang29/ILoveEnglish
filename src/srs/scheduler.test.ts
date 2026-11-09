import { describe, expect, it } from 'vitest';
import { scheduleReview } from './scheduler';

const NOW = new Date('2026-01-05T08:00:00.000Z');

describe('scheduleReview', () => {
  it('首次复习生成不早于当前时间的到期时间', () => {
    const { review, log } = scheduleReview('able', undefined, 'good', NOW);
    expect(review.wordId).toBe('able');
    expect(review.dueAt).toBeGreaterThanOrEqual(NOW.getTime());
    expect(review.reps).toBe(1);
    expect(log.wordId).toBe('able');
    expect(log.reviewedAt).toBe(NOW.getTime());
  });

  it('自评“忘记”后仍不会把到期时间排到过去', () => {
    const { review } = scheduleReview('able', undefined, 'again', NOW);
    expect(review.dueAt).toBeGreaterThanOrEqual(NOW.getTime());
  });

  it('再次复习会沿用已有记忆状态', () => {
    const first = scheduleReview('able', undefined, 'good', NOW);
    const later = new Date(NOW.getTime() + 86_400_000);
    const second = scheduleReview('able', first.review, 'good', later);

    expect(second.review.reps).toBeGreaterThan(first.review.reps);
    expect(second.review.lastReviewAt).toBe(later.getTime());
    expect(second.review.dueAt).toBeGreaterThanOrEqual(later.getTime());
  });
});
