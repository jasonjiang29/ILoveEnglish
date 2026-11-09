import { useEffect, useMemo, useState } from 'react';
import { SpeechButton } from '../components/SpeechButton';
import { useWordPack } from '../data/WordPackContext';
import type { Level } from '../data/types';
import { getAllReviews } from '../db/repository';
import type { ReviewRecord } from '../db/types';

const LEVEL_FILTERS = ['全部', '必修', '选必', '提高', '上海增补'] as const;
type LevelFilter = (typeof LEVEL_FILTERS)[number];

const LEVEL_CLASS: Record<Level, string> = {
  必修: 'lvl-required',
  选必: 'lvl-elective',
  提高: 'lvl-advanced',
  上海增补: 'lvl-shanghai',
};

export default function WordsPage() {
  const pack = useWordPack();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('全部');

  useEffect(() => {
    let active = true;
    getAllReviews()
      .then((records) => {
        if (active) setReviews(records);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const reviewMap = useMemo(
    () => new Map(reviews.map((review) => [review.wordId, review])),
    [reviews],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pack.words.filter((word) => {
      const levelMatch = levelFilter === '全部' || word.level === levelFilter;
      const queryMatch =
        normalized === '' ||
        word.lemma.toLowerCase().includes(normalized) ||
        word.glossZh.includes(normalized);
      return levelMatch && queryMatch;
    });
  }, [pack.words, query, levelFilter]);

  const now = Date.now();

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">词库</p>
        <h1>单词本</h1>
        <p className="page-sub">共 {pack.words.length} 个上海高考核心词。</p>
      </header>

      <input
        type="search"
        className="search-input"
        placeholder="搜索英文或中文释义"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="搜索单词"
      />

      <div className="filter-row" role="group" aria-label="按考纲级别筛选">
        {LEVEL_FILTERS.map((level) => (
          <button
            key={level}
            type="button"
            className={`chip ${levelFilter === level ? 'chip--active' : ''}`}
            onClick={() => setLevelFilter(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <p className="result-count">找到 {filtered.length} 个词</p>

      {filtered.length === 0 ? (
        <div className="card empty-card">
          <p>没有匹配的单词，换个关键词试试。</p>
        </div>
      ) : (
        <ul className="word-list">
          {filtered.map((word) => {
            const review = reviewMap.get(word.id);
            const status = !review ? '新词' : review.dueAt <= now ? '待复习' : '已学';
            return (
              <li key={word.id} className="word-row">
                <div className="word-row-main">
                  <div className="word-row-title">
                    <span className="word-lemma">{word.lemma}</span>
                    <span className={`level-tag ${LEVEL_CLASS[word.level]}`}>{word.level}</span>
                    <span className={`status-tag ${status === '待复习' ? 'status-tag--due' : ''}`}>
                      {status}
                    </span>
                  </div>
                  <p className="word-gloss">{word.glossZh}</p>
                </div>
                <SpeechButton text={word.lemma} compact />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
