import { describe, expect, it } from 'vitest';
import { loadWordPack } from './loader';
import { parseWordPack, validateWordPack, WordPackError } from './wordSchema';

describe('validateWordPack', () => {
  it('接受合法词库', () => {
    const pack = validateWordPack({
      version: '1.0.0',
      words: [{ id: 'able', lemma: 'able', glossZh: '能够的', level: '必修' }],
    });
    expect(pack.words).toHaveLength(1);
    expect(pack.version).toBe('1.0.0');
  });

  it('缺少释义时报告问题', () => {
    expect(() =>
      validateWordPack({
        version: '1.0.0',
        words: [{ id: 'able', lemma: 'able', level: '必修' }],
      }),
    ).toThrow(WordPackError);
  });

  it('重复 id 时报告问题', () => {
    expect(() =>
      validateWordPack({
        version: '1.0.0',
        words: [
          { id: 'able', lemma: 'able', glossZh: '能够的', level: '必修' },
          { id: 'able', lemma: 'able', glossZh: '能够的', level: '必修' },
        ],
      }),
    ).toThrow(/id 重复/);
  });
});

describe('parseWordPack', () => {
  it('无法解析的文本给出可读错误', () => {
    expect(() => parseWordPack('not json')).toThrow(/无法解析/);
  });
});

describe('内置词库', () => {
  it('包含 300 个通过校验的词条', () => {
    const pack = loadWordPack();
    expect(pack.version).toBe('1.0.0');
    expect(pack.words).toHaveLength(300);
    expect(new Set(pack.words.map((word) => word.id)).size).toBe(300);
  });
});
