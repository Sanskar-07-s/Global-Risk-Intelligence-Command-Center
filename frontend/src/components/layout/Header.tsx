import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe2, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Sparkles,
  Command,
  ArrowRight
} from 'lucide-react';
import { RiskOverview } from '../../types';

interface HeaderProps {
  riskOverview: RiskOverview | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExecuteCommand: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  riskOverview,
  onRefresh,
  isRefreshing,
  onExecuteCommand
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onExecuteCommand(query);
    setIsFocused(false);
  };

  const sampleQueries = [
    "What are the most significant emerging risks in South Asia?",
    "Show severe natural hazards in the last 24 hours.",
    "Explain latest CISA KEV remote code execution vulnerabilities.",
    "Evaluate compound supply chain chokepoints."
  ];

  const threatLevel = riskOverview?.threat_level || 'ELEVATED';

  return (
    <header className="absolute top-4 inset-x-6 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* 1. Left Brand & Telemetry Badge */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        <div className="command-surface-elevated px-3 py-2 rounded-xl flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
          <span className="font-semibold text-xs tracking-wider text-content-primary">
            GRICC
          </span>
          <span className="text-[10px] font-mono text-content-muted">|</span>
          <span className="text-[11px] font-mono text-content-secondary">
            {threatLevel}
          </span>
          <span className="text-[10px] font-mono text-content-muted">|</span>
          <span className="text-[11px] font-mono text-content-muted">
            {utcTime}
          </span>
        </div>
      </div>

      {/* 2. Center Natural Language Command Prompt */}
      <div className="relative w-full max-w-xl mx-4 pointer-events-auto">
        <form onSubmit={handleSubmit}>
          <div className={`command-surface transition-all duration-200 rounded-xl flex items-center px-3.5 py-2 ${
            isFocused ? 'command-surface-active' : 'hover:border-surface-border-active'
          }`}>
            <Search className="w-4 h-4 text-content-secondary flex-shrink-0 mr-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Ask an intelligence question or filter global events... (Enter to submit)"
              className="w-full text-xs font-sans bg-transparent text-content-primary placeholder-content-muted focus:outline-none"
            />
            {query.trim() && (
              <button
                type="submit"
                className="p-1 rounded bg-signal-cyan/20 text-signal-cyan hover:bg-signal-cyan/30 transition-colors ml-2"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-content-muted border border-surface-border ml-2">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Suggested Queries Dropdown */}
        {isFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 command-surface-elevated rounded-xl p-2.5 space-y-1 text-xs font-mono shadow-subtle-surface">
            <div className="text-[10px] text-content-muted px-2 py-1 uppercase tracking-wider">
              SUGGESTED INTELLIGENCE COMMANDS
            </div>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => {
                  setQuery(sq);
                  onExecuteCommand(sq);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-subtle text-content-secondary hover:text-content-primary flex items-center space-x-2 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-signal-cyan flex-shrink-0" />
                <span className="truncate">{sq}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Right Status & Refresh Action */}
      <div className="flex items-center space-x-2 pointer-events-auto">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="command-surface-elevated p-2 rounded-xl text-content-secondary hover:text-signal-cyan transition-colors"
          title="Refresh multi-domain sensor feeds"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-signal-cyan' : ''}`} />
        </button>

        <div className="command-surface-elevated px-3 py-2 rounded-xl flex items-center space-x-2 text-xs font-mono text-content-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />
          <span className="hidden md:inline">SENSORS ONLINE</span>
        </div>
      </div>
    </header>
  );
};
