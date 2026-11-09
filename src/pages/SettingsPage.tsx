import { useEffect, useRef, useState } from 'react';
import { useWordPack } from '../data/WordPackContext';
import { importProgress, serializeProgress, setDailyNewLimit } from '../db/repository';

interface SettingsPageProps {
  dailyNewLimit: number;
  onRefresh: () => Promise<void>;
}

export default function SettingsPage({ dailyNewLimit, onRefresh }: SettingsPageProps) {
  const pack = useWordPack();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [limit, setLimit] = useState(dailyNewLimit);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    setLimit(dailyNewLimit);
  }, [dailyNewLimit]);

  const saveLimit = async (value: number) => {
    const safe = Math.max(0, Math.min(100, Math.floor(Number.isFinite(value) ? value : 0)));
    setLimit(safe);
    await setDailyNewLimit(safe);
    await onRefresh();
  };

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await serializeProgress();
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `iloveenglish-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('进度已导出，请把文件保存好。');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '导出失败');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (file: File) => {
    const confirmed = window.confirm('导入会覆盖当前学习进度，确定继续吗？');
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const result = await importProgress(text);
      await onRefresh();
      setMessage(`导入成功：${result.reviewCount} 条复习记录，${result.logCount} 条日志。`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '导入失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">设置</p>
        <h1>按自己的节奏</h1>
        <p className="page-sub">不需要账号，学习进度自动保存在本机。</p>
      </header>

      <section className="card">
        <h3 className="section-title">每日新词上限</h3>
        <p className="muted">建议从 10 个开始，稳定后再慢慢加。</p>
        <div className="stepper">
          <button
            type="button"
            className="stepper-btn"
            aria-label="减少每日新词"
            onClick={() => void saveLimit(limit - 1)}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            max={100}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            onBlur={() => void saveLimit(limit)}
            aria-label="每日新词上限"
          />
          <button
            type="button"
            className="stepper-btn"
            aria-label="增加每日新词"
            onClick={() => void saveLimit(limit + 1)}
          >
            +
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">进度备份</h3>
        <p className="muted">换手机或重装前，先导出 JSON 文件。</p>
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void handleExport()}
          >
            导出进度
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            导入进度
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleImport(file);
            }}
          />
        </div>
        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">安装到 iPhone</h3>
        <p className="muted">
          用 Safari 打开本页，点底部分享按钮，选择“添加到主屏幕”，就能像 App 一样使用。
        </p>
      </section>

      <section className="info-list">
        <div className="info-row">
          <span>词库版本</span>
          <strong>v{pack.version}</strong>
        </div>
        <div className="info-row">
          <span>词条数量</span>
          <strong>{pack.words.length} 词</strong>
        </div>
        <div className="info-row">
          <span>朗读支持</span>
          <strong>{speechSupported ? '可用' : '不可用'}</strong>
        </div>
        <div className="info-row">
          <span>数据位置</span>
          <strong>本机浏览器</strong>
        </div>
      </section>

      <p className="pack-meta">我爱英语 · 上海高考词汇 · v0.1.0</p>
    </div>
  );
}
