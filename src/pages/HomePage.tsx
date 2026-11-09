import type { Tab } from '../components/BottomNav';
import { useWordPack } from '../data/WordPackContext';
import type { StudyStats } from '../db/repository';

interface HomePageProps {
  stats: StudyStats | null;
  dailyNewLimit: number;
  onNavigate: (tab: Tab) => void;
}

export default function HomePage({ stats, dailyNewLimit, onNavigate }: HomePageProps) {
  const pack = useWordPack();
  const due = stats?.dueCount ?? 0;
  const remainingNew = Math.max(0, dailyNewLimit - (stats?.newIntroducedToday ?? 0));
  const total = due + remainingNew;

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">上海高考词汇</p>
        <h1>我爱英语</h1>
        <p className="page-sub">每天一点点，把高考词汇认熟。</p>
      </header>

      <section className={`hero ${total === 0 ? 'hero--done' : ''}`}>
        <div className="hero-top">
          <span className="hero-label">{total > 0 ? '今日任务' : '今日已完成'}</span>
          <span className="hero-count">{total > 0 ? total : '✓'}</span>
        </div>
        <h2>{total > 0 ? `${total} 个词等你复习` : '今天的任务完成了'}</h2>
        <p className="hero-sub">
          待复习 {due} 个 · 新词 {remainingNew} 个
        </p>
        <button
          type="button"
          className="btn btn-light hero-cta"
          onClick={() => onNavigate(total > 0 ? 'review' : 'words')}
        >
          {total > 0 ? '开始今日复习' : '浏览单词'}
        </button>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">已学单词</span>
          <strong className="stat-value">{stats?.learnedCount ?? '—'}</strong>
          <span className="stat-hint">共 {pack.words.length} 词</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">连续学习</span>
          <strong className="stat-value">{stats?.streakDays ?? '—'}</strong>
          <span className="stat-hint">天</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">今日完成</span>
          <strong className="stat-value">{stats?.todayCompleted ?? '—'}</strong>
          <span className="stat-hint">个词</span>
        </div>
      </section>

      <section className="card tip-card">
        <h3>怎么学更有效</h3>
        <p>先看单词自己回想，再点“显示释义”。诚实自评，复习节奏才会准。</p>
      </section>

      <p className="pack-meta">
        词库 v{pack.version} · {pack.words.length} 词 · 进度保存在本机
      </p>
    </div>
  );
}
