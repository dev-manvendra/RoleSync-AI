import { RotateCcw } from "lucide-react";

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="11" cy="15" r="9" fill="#2B3FE0" />
      <circle cx="19" cy="15" r="9" fill="#D98A00" fillOpacity=".85" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

export default function Header({ demo, canReset, onReset }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-mist/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight">RoleMatch AI</span>
          {demo && (
            <span className="ml-1 rounded-full bg-signal-soft px-2 py-0.5 text-xs font-semibold text-signal">Demo data</span>
          )}
        </div>
        {canReset && (
          <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate2 transition hover:bg-white hover:text-ink">
            <RotateCcw size={15} /> Start over
          </button>
        )}
      </div>
    </header>
  );
}
