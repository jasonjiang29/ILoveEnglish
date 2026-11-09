import { WordPackError } from '../data/wordSchema';

export function StartupError({ error }: { error: Error }) {
  const issues = error instanceof WordPackError ? error.issues : [];

  return (
    <main className="startup-error">
      <div className="startup-error-card">
        <p className="eyebrow">无法启动</p>
        <h1>词库加载失败</h1>
        <p className="startup-error-message">{error.message}</p>
        {issues.length > 0 && (
          <ul className="startup-error-list">
            {issues.slice(0, 8).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    </main>
  );
}
