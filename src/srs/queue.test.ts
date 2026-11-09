import { describe, expect, it } from 'vitest';
import type { Word } from '../data/types';
import type { ReviewRecord } from '../db/types';
import { buildQueue } from './queue';

function word(id: string, rank: number): Word {
  return {
    id,
    lemma: id,
    glossZh: '释义',
    level: '必修',
    frequencyRank: rank,
  };
}

function review(wordId: string, dueAt: number): ReviewRecord {
  return {
    wordId,
    dueAt,
    stability: 1,
    difficulty: 5,
    reps: 1,
    lapses: 0,
    state: 2,
    lastReviewAt: dueAt - 86_400_000,
    scheduledDays: 1,
    elapsedDays: 1,
  };
}

const NOW = new Date('2026-01-05T08:00:00.000Z');

describe('buildQueue', () => {
  const words = [word('a', 1), word('b', 2), word('c', 3)];

  it('到期卡片优先于新词', () => {
    const queue = buildQueue(words, [review('b', NOW.getTime() - 1000)], {
      now: NOW,
      dailyNewLimit: 10,
    });
    expect(queue.map((item) => item.word.id)).toEqual(['b', 'a', 'c']);
    expect(queue[0].isNew).toBe(false);
  });

  it('没有到期卡片时只返回新词', () => {
    const queue = buildQueue(words, [], { now: NOW, dailyNewLimit: 2 });
    expect(queue.map((item) => item.word.id)).toEqual(['a', 'b']);
    expect(queue.every((item) => item.isNew)).toBe(true);
  });

  it('遵守当日新词上限并扣除今天已学的新词', () => {
    const queue = buildQueue(words, [], {
      now: NOW,
      dailyNewLimit: 3,
      newIntroducedToday: 2,
    });
    expect(queue).toHaveLength(1);
    expect(queue[0].word.id).toBe('a');
  });

  it('重复的复习记录只出现一次', () => {
    const due = NOW.getTime() - 1000;
    const queue = buildQueue(words, [review('a', due), review('a', due)], {
      now: NOW,
      dailyNewLimit: 0,
    });
    expect(queue).toHaveLength(1);
  });
});
