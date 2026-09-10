import { ReactNode } from "react";

export function AppShell({ children, showHeader, onBack, progress }: { children: ReactNode; showHeader: boolean; onBack?: () => void; progress?: number }) {
  return (
    <div className="app-shell">
      {showHeader && (
        <header className="app-header">
          <button className={`back-button ${onBack ? "" : "invisible"}`} onClick={onBack} aria-label="Go back">←</button>
          <span className="brand-lockup">AFTERMARK</span>
          {progress ? <span className="step-count">{String(progress).padStart(2, "0")} / 05</span> : <span className="step-count">ONE OF ONE</span>}
          {progress && <div className="progress-track" aria-hidden><span style={{ width: `${progress * 20}%` }} /></div>}
        </header>
      )}
      {children}
    </div>
  );
}
