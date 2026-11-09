import { createContext, useContext, type ReactNode } from 'react';
import type { WordPack } from './types';

const WordPackContext = createContext<WordPack | null>(null);

export function WordPackProvider({ pack, children }: { pack: WordPack; children: ReactNode }) {
  return <WordPackContext.Provider value={pack}>{children}</WordPackContext.Provider>;
}

export function useWordPack(): WordPack {
  const pack = useContext(WordPackContext);
  if (!pack) throw new Error('useWordPack 必须在 WordPackProvider 内使用');
  return pack;
}
