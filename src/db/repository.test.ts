import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { WordPack } from '../data/types';
import { scheduleReview } from '../srs/scheduler';
import { db } from './database';
import {
  ensureWordCache,
  getDailyNewLimit,
  getNewIntroducedToday,
  getReview,
  getStats,
  importProgress,
  saveReview,
  serializeProgress,
  setDailyNewLimit,
} from './repository';

const NOW = new Date('2026-01-05T08:00:00.000Z');

const PACK: WordPack = {
  version: '1.0.0',
  words: [
    { id: 'able', lemma: 'able', glossZh: '能够的', level: '必修', frequencyRank: 1 },
    { id: 'about', lemma: 'about', glossZh: '关于', level: '必修', frequencyRank: 2 },
  ],
};

beforeEach(async () => {
  await Promise.all([
    db.words.clear(),
    db.reviews.clear(),
    db.reviewLogs.clear(),
    db.settings.clear(),
    db.meta.clear(),
  ]);
});

describe('词库缓存', () => {
  it('写入词条并记录版本', async () => {
    await ensureWordCache(PACK);
    await ensureWordCache(PACK);
    expect(await db.words.count()).toBe(2);
    expect((await db.meta.get('wordPackVersion'))?.value).toBe('1.0.0');
  });
});

describe('复习记录', () => {
  it('写入后可以读回', async () => {
    const { review, log } = scheduleReview('able', undefined, 'good', NOW);
    await saveReview(review, log);

    const stored = await getReview('able');
    expect(stored?.wordId).toBe('able');
    expect(stored?.reps).toBe(1);
    expect(stored?.dueAt).toBeGreaterThanOrEqual(NOW.getTime());
    expect(await db.reviewLogs.count()).toBe(1);
  });
});

describe('设置与统计', () => {
  it('每日新词上限默认 10 且可修改', async () => {
    expect(await getDailyNewLimit()).toBe(10);
    await setDailyNewLimit(5);
    expect(await getDailyNewLimit()).toBe(5);
  });

  it('统计今日完成、连续天数和新学数量', async () => {
    const { review, log } = scheduleReview('able', undefined, 'good', NOW);
    await saveReview(review, log);

    expect(await getNewIntroducedToday(NOW)).toBe(1);

    const stats = await getStats(2, NOW);
    expect(stats.totalWords).toBe(2);
    expect(stats.learnedCount).toBe(1);
    expect(stats.todayCompleted).toBe(1);
    expect(stats.newIntroducedToday).toBe(1);
    expect(stats.streakDays).toBe(1);
    expect(stats.nextDueAt).toBe(review.dueAt);
    expect(stats.stateDistribution.new).toBe(1);
  });
});

describe('导出与导入', () => {
  it('导出后导入可以恢复复习进度', async () => {
    const { review, log } = scheduleReview('able', undefined, 'good', NOW);
    await saveReview(review, log);
    await setDailyNewLimit(7);

    const exported = await serializeProgress(NOW);
    await Promise.all([db.reviews.clear(), db.reviewLogs.clear(), db.settings.clear()]);
    expect(await db.reviews.count()).toBe(0);

    const result = await importProgress(exported);
    expect(result).toEqual({ reviewCount: 1, logCount: 1 });
    expect((await getReview('able'))?.dueAt).toBe(review.dueAt);
    expect(await getDailyNewLimit()).toBe(7);
  });

  it('拒绝无效进度文件', async () => {
    await expect(importProgress('not json')).rejects.toThrow(/不是有效的 JSON/);
    await expect(importProgress({ schemaVersion: 2 })).rejects.toThrow(/schemaVersion/);
  });
});
