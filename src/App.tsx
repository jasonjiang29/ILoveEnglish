import { useCallback, useEffect, useMemo, useState } from 'react';
import { BottomNav, type Tab } from './components/BottomNav';
import { StartupError } from './components/StartupError';
import { loadWordPack } from './data/loader';
import type { WordPack } from './data/types';
import { WordPackProvider } from './data/WordPackContext';
import { ensureWordCache, getDailyNewLimit, getStats, type StudyStats } from './db/repository';
import HomePage from './pages/HomePage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import WordsPage from './pages/WordsPage';

type Loaded = { pack: WordPack } | { error: Error };

function Shell({ pack }: { pack: WordPack }) {
  const [tab, setTab] = useState<Tab>('home');
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [dailyNewLimit, setDailyNewLimit] = useState(10);

  const refresh = useCallback(async () => {
    const [nextStats, nextLimit] = await Promise.all([
      getStats(pack.words.length),
      getDailyNewLimit(),
    ]);
    setStats(nextStats);
    setDailyNewLimit(nextLimit);
  }, [pack.words.length]);

  useEffect(() => {
    void refresh().catch((cause) => {
      console.error('读取学习统计失败', cause);
    });
  }, [refresh]);

  let content;
  switch (tab) {
    case 'review':
      content = (
        <ReviewPage onReviewed={refresh} onNavigate={setTab} nextDueAt={stats?.nextDueAt ?? null} />
      );
      break;
    case 'words':
      content = <WordsPage />;
      break;
    case 'stats':
      content = <StatsPage stats={stats} />;
      break;
    case 'settings':
      content = <SettingsPage dailyNewLimit={dailyNewLimit} onRefresh={refresh} />;
      break;
    default:
      content = <HomePage stats={stats} dailyNewLimit={dailyNewLimit} onNavigate={setTab} />;
  }

  return (
    <div className="app-shell">
      <main className="app-main">{content}</main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  const loaded = useMemo<Loaded>(() => {
    try {
      return { pack: loadWordPack() };
    } catch (cause) {
      return { error: cause instanceof Error ? cause : new Error(String(cause)) };
    }
  }, []);

  useEffect(() => {
    if ('pack' in loaded) {
      void ensureWordCache(loaded.pack).catch((cause) => {
        console.error('缓存词库失败', cause);
      });
    }
  }, [loaded]);

  if ('error' in loaded) {
    return <StartupError error={loaded.error} />;
  }

  return (
    <WordPackProvider pack={loaded.pack}>
      <Shell pack={loaded.pack} />
    </WordPackProvider>
  );
}
