export interface ReviewRecord {
  wordId: string;
  dueAt: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: number;
  lastReviewAt: number;
  scheduledDays: number;
  elapsedDays: number;
}

export interface ReviewLog {
  id?: number;
  wordId: string;
  rating: number;
  reviewedAt: number;
  elapsedDays: number;
  scheduledDays: number;
}

export interface SettingRecord {
  key: string;
  value: string;
}

export interface MetaRecord {
  key: string;
  value: string;
}

export interface ProgressExport {
  schemaVersion: number;
  exportedAt: string;
  reviews: ReviewRecord[];
  reviewLogs: ReviewLog[];
  settings: SettingRecord[];
}

export interface ImportResult {
  reviewCount: number;
  logCount: number;
}
