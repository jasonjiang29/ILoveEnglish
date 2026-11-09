import type { Level, Word, WordPack } from './types';

export const LEVELS: readonly Level[] = ['必修', '选必', '提高', '上海增补'];

export class WordPackError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'WordPackError';
    this.issues = issues;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateWordPack(input: unknown): WordPack {
  if (typeof input !== 'object' || input === null) {
    throw new WordPackError('词库格式错误：顶层必须是对象');
  }

  const pack = input as Record<string, unknown>;
  if (!isNonEmptyString(pack.version)) {
    throw new WordPackError('词库校验失败：缺少版本号 version');
  }
  if (!Array.isArray(pack.words)) {
    throw new WordPackError('词库校验失败：缺少词条数组 words');
  }

  const issues: string[] = [];
  const seen = new Set<string>();
  const words: Word[] = [];

  pack.words.forEach((raw, index) => {
    const label = `第 ${index + 1} 条`;
    if (typeof raw !== 'object' || raw === null) {
      issues.push(`${label}：不是对象`);
      return;
    }

    const word = raw as Record<string, unknown>;
    const hasId = isNonEmptyString(word.id);
    const hasLemma = isNonEmptyString(word.lemma);
    const hasGloss = isNonEmptyString(word.glossZh);
    const hasLevel = isNonEmptyString(word.level) && LEVELS.includes(word.level as Level);

    if (!hasId) issues.push(`${label}：缺少 id`);
    if (!hasLemma) issues.push(`${label}：缺少词形 lemma`);
    if (!hasGloss) issues.push(`${label}：缺少释义 glossZh`);
    if (!hasLevel) issues.push(`${label}：考纲级别 level 无效`);

    if (hasId) {
      if (seen.has(word.id as string)) issues.push(`${label}：id 重复`);
      seen.add(word.id as string);
    }

    if (hasId && hasLemma && hasGloss && hasLevel) {
      words.push(raw as Word);
    }
  });

  if (issues.length > 0) {
    throw new WordPackError(
      `词库校验失败（${issues.length} 处问题）：${issues.join('；')}`,
      issues,
    );
  }

  return { version: pack.version, words };
}

export function parseWordPack(text: string): WordPack {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WordPackError('词库无法解析：不是有效的 JSON');
  }
  return validateWordPack(data);
}
