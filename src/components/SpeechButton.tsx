import { useState } from 'react';

export function speak(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

interface SpeechButtonProps {
  text: string;
  compact?: boolean;
}

export function SpeechButton({ text, compact = false }: SpeechButtonProps) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      className={`speech-btn ${compact ? 'speech-btn--compact' : ''}`}
      disabled={!supported}
      title={!supported ? '当前浏览器不支持朗读' : failed ? '朗读失败，请再试一次' : `朗读 ${text}`}
      aria-label={`朗读 ${text}`}
      onClick={(event) => {
        event.stopPropagation();
        if (!speak(text)) setFailed(true);
      }}
    >
      <svg
        width={compact ? 18 : 20}
        height={compact ? 18 : 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 10v4h3l4 3V7l-4 3H4z" />
        <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
      </svg>
      {!compact && <span>{supported ? '朗读' : '不支持朗读'}</span>}
    </button>
  );
}
