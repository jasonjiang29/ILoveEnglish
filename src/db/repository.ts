import type { WordPack } from '../data/types';
import { db } from './database';
import type { ImportResult, ProgressExport, ReviewLog, ReviewRecord, SettingRecord } from './types';

const SCHEMA_VERSION = 1;
const DEFAULT_DAILY_NEW_LIMIT = 10;

export interface StudyStats {
  totalWords: number;
  learnedCount: number;
  todayCompleted: number;
  newIntroducedToday: number;
  streakDays: number;
  dueCount: number;
  nextDueAt: number | null;
  stateDistribution: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
}

function localDayKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function ensureWordCache(pack: WordPack): Promise<void> {
  const cachedVersion = await db.meta.get('wordPackVersion');
  const cachedCount = await db.words.count();

  if (cachedVersion?.value === pack.version && cachedCount === pack.words.length) {
    return;
  }

  await db.transaction('rw', db.words, db.meta, async () => {
    await db.words.clear();
    await db.words.bulkPut(pack.words);
    await db.meta.put({ key: 'wordPackVersion', value: pack.version });
  });
}

export async function getReview(wordId: string): Promise<ReviewRecord | undefined> {
  return db.reviews.get(wordId);
}

export async function getAllReviews(): Promise<ReviewRecord[]> {
  return db.reviews.toArray();
}

export async function getAllLogs(): Promise<ReviewLog[]> {
  return db.reviewLogs.toArray();
}

export async function saveReview(review: ReviewRecord, log: Omit<ReviewLog, 'id'>): Promise<void> {
  await db.transaction('rw', db.reviews, db.reviewLogs, async () => {
    await db.reviews.put(review);
    await db.reviewLogs.add(log);
  });
}

export async function getDailyNewLimit(): Promise<number> {
  const record = await db.settings.get('dailyNewLimit');
  if (!record) return DEFAULT_DAILY_NEW_LIMIT;
  const value = Number(record.value);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_DAILY_NEW_LIMIT;
}

export async function setDailyNewLimit(limit: number): Promise<void> {
  const safe = Math.max(0, Math.floor(limit));
  await db.settings.put({ key: 'dailyNewLimit', value: String(safe) });
}

export async function getNewIntroducedToday(now: Date = new Date()): Promise<number> {
  const logs = await db.reviewLogs.toArray();
  const firstReviewAt = new Map<string, number>();

  for (const log of logs) {
    const current = firstReviewAt.get(log.wordId);
    if (current === undefined || log.reviewedAt < current) {
      firstReviewAt.set(log.wordId, log.reviewedAt);
    }
  }

  const todayKey = localDayKey(now.getTime());
  let count = 0;
  for (const reviewedAt of firstReviewAt.values()) {
    if (localDayKey(reviewedAt) === todayKey) count += 1;
  }
  return count;
}

export async function getStats(totalWords: number, now: Date = new Date()): Promise<StudyStats> {
  const [reviews, logs] = await Promise.all([db.reviews.toArray(), db.reviewLogs.toArray()]);
  const todayKey = localDayKey(now.getTime());
  const completedToday = new Set<string>();

  for (const log of logs) {
    if (localDayKey(log.reviewedAt) === todayKey) completedToday.add(log.wordId);
  }

  const firstReviewAt = new Map<string, number>();
  for (const log of logs) {
    const current = firstReviewAt.get(log.wordId);
    if (current === undefined || log.reviewedAt < current) {
      firstReviewAt.set(log.wordId, log.reviewedAt);
    }
  }
  let newIntroducedToday = 0;
  for (const reviewedAt of firstReviewAt.values()) {
    if (localDayKey(reviewedAt) === todayKey) newIntroducedToday += 1;
  }

  const activeDays = new Set(logs.map((log) => localDayKey(log.reviewedAt)));
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(localDayKey(cursor.getTime()))) {
    cursor = new Date(cursor.getTime());
    cursor.setDate(cursor.getDate() - 1);
  }
  let streakDays = 0;
  while (activeDays.has(localDayKey(cursor.getTime()))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const stateDistribution = {
    new: Math.max(0, totalWords - reviews.length),
    learning: 0,
    review: 0,
    relearning: 0,
  };
  let dueCount = 0;
  let nextDueAt: number | null = null;

  for (const review of reviews) {
    if (review.state === 1) stateDistribution.learning += 1;
    else if (review.state === 2) stateDistribution.review += 1;
    else if (review.state === 3) stateDistribution.relearning += 1;
    else stateDistribution.new += 1;

    if (review.dueAt <= now.getTime()) dueCount += 1;
    if (nextDueAt === null || review.dueAt < nextDueAt) nextDueAt = review.dueAt;
  }

  return {
    totalWords,
    learnedCount: reviews.length,
    todayCompleted: completedToday.size,
    newIntroducedToday,
    streakDays,
    dueCount,
    nextDueAt,
    stateDistribution,
  };
}

export async function exportProgress(now: Date = new Date()): Promise<ProgressExport> {
  const [reviews, reviewLogs, settings] = await Promise.all([
    db.reviews.toArray(),
    db.reviewLogs.toArray(),
    db.settings.toArray(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    reviews,
    reviewLogs,
    settings,
  };
}

export async function serializeProgress(now: Date = new Date()): Promise<string> {
  const payload = await exportProgress(now);
  return JSON.stringify(payload, null, 2);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReviewRecord(value: unknown): value is ReviewRecord {
  if (!isObject(value)) return false;
  return (
    typeof value.wordId === 'string' &&
    typeof value.dueAt === 'number' &&
    typeof value.stability === 'number' &&
    typeof value.difficulty === 'number' &&
    typeof value.reps === 'number' &&
    typeof value.lapses === 'number' &&
    typeof value.state === 'number' &&
    typeof value.lastReviewAt === 'number' &&
    typeof value.scheduledDays === 'number' &&
    typeof value.elapsedDays === 'number'
  );
}

function isReviewLog(value: unknown): value is ReviewLog {
  if (!isObject(value)) return false;
  return (
    typeof value.wordId === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.reviewedAt === 'number' &&
    typeof value.elapsedDays === 'number' &&
    typeof value.scheduledDays === 'number'
  );
}

function isSetting(value: unknown): value is SettingRecord {
  return isObject(value) && typeof value.key === 'string' && typeof value.value === 'string';
}

export async function importProgress(input: string | unknown): Promise<ImportResult> {
  let data: unknown = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      throw new Error('进度文件无效：不是有效的 JSON');
    }
  }

  if (!isObject(data) || data.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`进度文件无效：schemaVersion 必须为 ${SCHEMA_VERSION}`);
  }
  if (!Array.isArray(data.reviews) || !data.reviews.every(isReviewRecord)) {
    throw new Error('进度文件无效：reviews 数据格式不正确');
  }
  if (!Array.isArray(data.reviewLogs) || !data.reviewLogs.every(isReviewLog)) {
    throw new Error('进度文件无效：reviewLogs 数据格式不正确');
  }

  const settings = Array.isArray(data.settings) ? data.settings.filter(isSetting) : [];

  await db.transaction('rw', db.reviews, db.reviewLogs, db.settings, async () => {
    await Promise.all([db.reviews.clear(), db.reviewLogs.clear(), db.settings.clear()]);
    await db.reviews.bulkPut(data.reviews as ReviewRecord[]);
    const logs = (data.reviewLogs as ReviewLog[]).map((log) => ({
      wordId: log.wordId,
      rating: log.rating,
      reviewedAt: log.reviewedAt,
      elapsedDays: log.elapsedDays,
      scheduledDays: log.scheduledDays,
    }));
    await db.reviewLogs.bulkAdd(logs);
    if (settings.length > 0) await db.settings.bulkPut(settings);
  });

  return { reviewCount: data.reviews.length, logCount: data.reviewLogs.length };
}
