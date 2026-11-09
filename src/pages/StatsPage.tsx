import { useWordPack } from '../data/WordPackContext';
import type { StudyStats } from '../db/repository';

const STATE_ROWS = [
  { key: 'new', label: '未学', color: 'var(--line-strong)' },
  { key: 'learning', label: '学习中', color: 'var(--warm)' },
  { key: 'review', label: '复习中', color: 'var(--accent)' },
  { key: 'relearning', label: '重学中', color: 'var(--danger)' },
] as const;

function formatDue(ts: number | null): string {
  if (ts === null) return '暂无安排';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

export default function StatsPage({ stats }: { stats: StudyStats | null }) {
  const pack = useWordPack();

  if (!stats) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="eyebrow">学习统计</p>
          <h1>正在统计</h1>
        </header>
        <div className="card loading-card" aria-busy="true">
          正在读取学习记录…
        </div>
      </div>
    );
  }

  const completion = pack.words.length === 0 ? 0 : (stats.learnedCount / pack.words.length) * 100;

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">学习统计</p>
        <h1>看见进步</h1>
        <p className="page-sub">数据只保存在这台设备上。</p>
      </header>

      <section className="hero hero--stats">
        <div className="hero-top">
          <span className="hero-label">词库完成度</span>
          <span className="hero-count">{Math.round(completion)}%</span>
        </div>
        <div className="completion-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, completion))}%` }} />
        </div>
        <p className="hero-sub">
          已学 {stats.learnedCount} / {stats.totalWords} 词
        </p>
      </section>

      <section className="stat-grid stat-grid--four">
        <div className="stat-card">
          <span className="stat-label">今日完成</span>
          <strong className="stat-value">{stats.todayCompleted}</strong>
          <span className="stat-hint">个词</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">待复习</span>
          <strong className="stat-value">{stats.dueCount}</strong>
          <span className="stat-hint">个词</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">连续学习</span>
          <strong className="stat-value">{stats.streakDays}</strong>
          <span className="stat-hint">天</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">今日新词</span>
          <strong className="stat-value">{stats.newIntroducedToday}</strong>
          <span className="stat-hint">个词</span>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">复习状态分布</h3>
        <div className="distribution">
          {STATE_ROWS.map((row) => {
            const value = stats.stateDistribution[row.key];
            const percent = stats.totalWords === 0 ? 0 : (value / stats.totalWords) * 100;
            return (
              <div key={row.key} className="distribution-row">
                <span className="distribution-label">{row.label}</span>
                <div className="distribution-track">
                  <span
                    style={{
                      width: `${value > 0 ? Math.max(3, percent) : 0}%`,
                      background: row.color,
                    }}
                  />
                </div>
                <span className="distribution-value">{value}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">下一次复习</h3>
        <p className="next-due">{formatDue(stats.nextDueAt)}</p>
        <p className="muted">复习时间由 FSRS 记忆算法安排。</p>
      </section>
    </div>
  );
}
