/**
 * Header Component
 * Top navigation bar with branding and actions
 */

import { Button } from '../ui';
import './Header.css';

// Simple icon components (inline SVG for minimal dependencies)
const SparklesIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const SunIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const DownloadIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const PanelRightIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M15 3v18" />
  </svg>
);

export default function Header({
  theme = 'system',
  onThemeChange,
  onExportJSON,
  onToggleInspector,
  inspectorVisible = true
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    onThemeChange?.(nextTheme);
  };

  return (
    <header className="header">
      <div className="header__brand">
        <SparklesIcon size={24} />
        <h1 className="header__title">Prompt Assistant</h1>
      </div>
      
      <nav className="header__actions" aria-label="Header actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportJSON}
          aria-label="Export configuration as JSON"
          title="Export JSON"
        >
          <DownloadIcon />
          <span className="header__action-text">Export</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleInspector}
          aria-label={inspectorVisible ? 'Hide options panel' : 'Show options panel'}
          aria-pressed={inspectorVisible}
          title={inspectorVisible ? 'Hide options' : 'Show options'}
          className="header__inspector-toggle"
        >
          <PanelRightIcon />
        </Button>
      </nav>
    </header>
  );
}
