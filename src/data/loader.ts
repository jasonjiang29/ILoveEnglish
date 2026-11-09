import rawPack from './words.json';
import { validateWordPack } from './wordSchema';
import type { WordPack } from './types';

export function loadWordPack(): WordPack {
  return validateWordPack(rawPack);
}

export { WordPackError, parseWordPack, validateWordPack } from './wordSchema';
export type { Level, Word, WordPack } from './types';
