import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe2, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Sparkles,
  Command,
  ArrowRight,
  Radio,
  Server,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { RiskOverview } from '../../types';
import { api, TelemetryStatus } from '../../services/api';

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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryStatus>(api.getTelemetryStatus());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      setTelemetry(api.getTelemetryStatus());
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

  // Determine badge styling based on real telemetry status
  const getBadgeStyle = () => {
    if (telemetry.mode === 'backend_connected') {
      return {
        color: 'bg-signal-green',
        text: 'BACKEND LIVE (SQLITE)',
        textColor: 'text-signal-green'
      };
    }
    if (telemetry.mode === 'edge_direct') {
      return {
        color: 'bg-signal-cyan',
        text: 'DIRECT SENSORS (USGS·NASA·CISA)',
        textColor: 'text-signal-cyan'
      };
    }
    if (telemetry.mode === 'degraded') {
      return {
        color: 'bg-signal-amber',
        text: 'TELEMETRY DEGRADED',
        textColor: 'text-signal-amber'
      };
    }
    return {
      color: 'bg-signal-amber animate-pulse',
      text: 'CONNECTING...',
      textColor: 'text-signal-amber'
    };
  };

  const badge = getBadgeStyle();

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

      {/* 3. Right Status & Refresh Action with Diagnostic Drawer */}
      <div className="flex items-center space-x-2 pointer-events-auto relative">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="command-surface-elevated p-2 rounded-xl text-content-secondary hover:text-signal-cyan transition-colors"
          title="Refresh multi-domain sensor feeds"
          aria-label="Refresh telemetry feeds"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-signal-cyan' : ''}`} />
        </button>

        {/* Interactive Telemetry Diagnostic Trigger */}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="command-surface-elevated px-3 py-2 rounded-xl flex items-center space-x-2 text-xs font-mono transition-colors hover:border-surface-border-active cursor-pointer"
          title="Click to view telemetry ingestion diagnostics"
          aria-expanded={showDiagnostics}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badge.color}`} />
          <span className="hidden md:inline font-medium">{badge.text}</span>
        </button>

        {/* Telemetry Diagnostics Popover */}
        {showDiagnostics && (
          <div className="absolute top-full right-0 mt-2 w-80 command-surface-elevated rounded-2xl p-4 shadow-subtle-surface border border-surface-border text-xs font-mono z-50 animate-fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-surface-border pb-2">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-signal-cyan" />
                <span className="font-semibold text-content-primary uppercase">TELEMETRY DIAGNOSTICS</span>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="p-1 rounded text-content-muted hover:text-content-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-content-muted">Pipeline Architecture:</span>
                <span className="text-content-primary font-semibold">
                  {telemetry.mode === 'backend_connected' ? 'FastAPI + SQLite Container' : 'High-Availability Direct Edge'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-content-muted">Backend Service:</span>
                <span className={telemetry.isBackendReachable ? 'text-signal-green' : 'text-signal-amber'}>
                  {telemetry.isBackendReachable ? 'Online & Ingesting' : 'Standalone Edge Mode'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-content-muted">Active Ingestion Feeds:</span>
                <span className="text-signal-cyan font-bold">
                  USGS (Seismic) · NASA EONET · CISA KEV
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-content-muted">Total Events Cached:</span>
                <span className="text-content-primary font-bold">
                  {riskOverview?.total_incidents || telemetry.totalEvents} Incidents
                </span>
              </div>

              {telemetry.lastSyncTime && (
                <div className="flex justify-between border-t border-surface-border/50 pt-1.5">
                  <span className="text-content-muted">Last Sensor Sweep:</span>
                  <span className="text-content-secondary">
                    {telemetry.lastSyncTime.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onRefresh();
                setShowDiagnostics(false);
              }}
              className="w-full py-2 rounded-xl bg-signal-cyan/15 hover:bg-signal-cyan/25 border border-signal-cyan/30 text-signal-cyan text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Synchronous Sweep</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
