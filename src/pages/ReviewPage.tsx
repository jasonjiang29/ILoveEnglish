import { useCallback, useEffect, useState } from 'react';
import type { Tab } from '../components/BottomNav';
import { SpeechButton } from '../components/SpeechButton';
import { useWordPack } from '../data/WordPackContext';
import {
  getAllReviews,
  getDailyNewLimit,
  getNewIntroducedToday,
  saveReview,
} from '../db/repository';
import { buildQueue, type QueueItem } from '../srs/queue';
import { scheduleReview, type RatingChoice } from '../srs/scheduler';

interface ReviewPageProps {
  onReviewed: () => Promise<void>;
  onNavigate: (tab: Tab) => void;
  nextDueAt: number | null;
}

function formatNextDue(ts: number | null): string {
  if (ts === null) return '暂无安排';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

const RATINGS: { choice: RatingChoice; label: string; hint: string; className: string }[] = [
  { choice: 'again', label: '忘记', hint: '没想起来', className: 'rating-btn--again' },
  { choice: 'hard', label: '模糊', hint: '想得吃力', className: 'rating-btn--hard' },
  { choice: 'good', label: '认识', hint: '顺利想起', className: 'rating-btn--good' },
];

export default function ReviewPage({ onReviewed, onNavigate, nextDueAt }: ReviewPageProps) {
  const pack = useWordPack();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const [reviews, introduced, limit] = await Promise.all([
        getAllReviews(),
        getNewIntroducedToday(),
        getDailyNewLimit(),
      ]);
      const queue = buildQueue(pack.words, reviews, {
        dailyNewLimit: limit,
        newIntroducedToday: introduced,
      });
      setItems(queue);
      setIndex(0);
      setRevealed(false);
      setCompleted(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载复习队列失败');
    } finally {
      setLoading(false);
    }
  }, [pack.words]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = index < items.length ? items[index] : undefined;

  const rate = async (choice: RatingChoice) => {
    if (!current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { review, log } = scheduleReview(current.word.id, current.review, choice);
      await saveReview(review, log);
      setCompleted((value) => value + 1);
      setIndex((value) => value + 1);
      setRevealed(false);
      try {
        await onReviewed();
      } catch (cause) {
        console.error('刷新学习统计失败', cause);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存复习结果失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">每日复习</p>
          <h1>正在准备今日队列</h1>
        </header>
        <div className="card loading-card" aria-busy="true">
          正在读取本机学习记录…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">每日复习</p>
          <h1>出了一点问题</h1>
        </header>
        <div className="card error-card">
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            重试
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0 || !current) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">每日复习</p>
          <h1>{completed > 0 ? '这一轮完成了' : '今天没有待复习的词'}</h1>
          <p className="page-sub">
            {completed > 0
              ? `刚刚复习了 ${completed} 个词，记得明天再来。`
              : '可以去单词页随便逛逛。'}
          </p>
        </header>
        <div className="card finish-card">
          <p className="finish-number">{completed}</p>
          <p className="finish-label">本轮复习词数</p>
          <p className="muted finish-due">下一次复习：{formatNextDue(nextDueAt)}</p>
          <div className="finish-actions">
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              再检查一轮
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('words')}>
              浏览单词
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = items.length === 0 ? 0 : (index / items.length) * 100;

  return (
    <div className="page">
      <header className="review-header">
        <button type="button" className="text-btn" onClick={() => onNavigate('home')}>
          返回首页
        </button>
        <span className="review-counter">
          {index + 1} / {items.length}
        </span>
      </header>

      <div className="review-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <article className={`review-card ${revealed ? 'review-card--revealed' : ''}`}>
        <div className="review-meta">
          <span className={`badge ${current.isNew ? 'badge-new' : 'badge-due'}`}>
            {current.isNew ? '新词' : '待复习'}
          </span>
          {current.word.pos && current.word.pos.length > 0 && (
            <span className="muted">{current.word.pos.join(' / ')}</span>
          )}
        </div>

        <h1 className="review-word">{current.word.lemma}</h1>
        {current.word.ipa && <p className="review-ipa">/{current.word.ipa}/</p>}

        <SpeechButton text={current.word.lemma} />

        {!revealed ? (
          <div className="reveal-area">
            <p className="reveal-hint">先在心里回想它的意思</p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setRevealed(true)}
            >
              显示释义
            </button>
          </div>
        ) : (
          <div className="answer-area">
            <p className="review-gloss">{current.word.glossZh}</p>
            {current.word.example && (
              <div className="review-example">
                <p>{current.word.example.en}</p>
                {current.word.example.zh && <p className="muted">{current.word.example.zh}</p>}
              </div>
            )}

            <p className="rating-prompt">刚才记住了吗？</p>
            <div className="rating-row">
              {RATINGS.map((rating) => (
                <button
                  key={rating.choice}
                  type="button"
                  className={`rating-btn ${rating.className}`}
                  disabled={saving}
                  onClick={() => void rate(rating.choice)}
                >
                  <span className="rating-label">{rating.label}</span>
                  <span className="rating-hint">{rating.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>

      <p className="review-footnote">已复习 {completed} 个词 · 进度自动保存在本机</p>
    </div>
  );
}
