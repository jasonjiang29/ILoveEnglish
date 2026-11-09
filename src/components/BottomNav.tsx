import type { ReactNode } from 'react';

export type Tab = 'home' | 'review' | 'words' | 'stats' | 'settings';

interface NavItem {
  id: Tab;
  label: string;
  icon: ReactNode;
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ITEMS: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    icon: (
      <svg {...iconProps}>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.5V20h12V9.5" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: '复习',
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    id: 'words',
    label: '单词',
    icon: (
      <svg {...iconProps}>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
        <path d="M8 20a3 3 0 0 1 0-6h11" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: '统计',
    icon: (
      <svg {...iconProps}>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '设置',
    icon: (
      <svg {...iconProps}>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </svg>
    ),
  },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${active === item.id ? 'nav-item--active' : ''}`}
          onClick={() => onChange(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
