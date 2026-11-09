import Dexie, { type Table } from 'dexie';
import type { Word } from '../data/types';
import type { MetaRecord, ReviewLog, ReviewRecord, SettingRecord } from './types';

export class AppDatabase extends Dexie {
  words!: Table<Word, string>;
  reviews!: Table<ReviewRecord, string>;
  reviewLogs!: Table<ReviewLog, number>;
  settings!: Table<SettingRecord, string>;
  meta!: Table<MetaRecord, string>;

  constructor(name = 'iloveenglish') {
    super(name);
    this.version(1).stores({
      words: 'id, lemma, level',
      reviews: 'wordId, dueAt, state',
      reviewLogs: '++id, wordId, reviewedAt',
      settings: 'key',
      meta: 'key',
    });
  }
}

export const db = new AppDatabase();
