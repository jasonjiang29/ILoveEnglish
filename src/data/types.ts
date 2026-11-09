export type Level = '必修' | '选必' | '提高' | '上海增补';

export interface WordExample {
  en: string;
  zh?: string;
}

export interface Word {
  id: string;
  lemma: string;
  ipa?: string;
  pos?: string[];
  glossZh: string;
  example?: WordExample;
  level: Level;
  frequencyRank?: number;
  tags?: string[];
}

export interface WordPack {
  version: string;
  words: Word[];
}
