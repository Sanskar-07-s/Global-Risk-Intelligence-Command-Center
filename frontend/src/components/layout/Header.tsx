import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  ShieldAlert, 
  Activity, 
  Radio, 
  Cpu, 
  RefreshCw,
  Search
} from 'lucide-react';
import { RiskOverview } from '../../types';

interface HeaderProps {
  riskOverview: RiskOverview | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  riskOverview,
  onRefresh,
  isRefreshing,
  onOpenSearch
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const threatLevel = riskOverview?.threat_level || 'ELEVATED';
  const getThreatColor = () => {
    switch (threatLevel) {
      case 'CRITICAL': return 'bg-cyber-red/20 text-cyber-red border-cyber-red/50 shadow-glow-red';
      case 'HIGH': return 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/50 shadow-glow-amber';
      default: return 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50 shadow-glow-cyan';
    }
  };

  return (
    <header className="h-16 border-b border-cyber-cyan/20 bg-obsidian-950/90 backdrop-blur-md px-6 flex items-center justify-between z-40 select-none">
      {/* Brand & System Identifier */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40">
          <Globe2 className="w-6 h-6 text-cyber-cyan animate-pulse" />
          <div className="absolute inset-0 rounded-lg border border-cyber-cyan/30 animate-pulse-ring pointer-events-none" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-display font-extrabold text-lg tracking-wider text-white">
              GRICC
            </span>
            <span className="text-[10px] font-mono tracking-widest text-cyber-cyan px-1.5 py-0.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
              v1.0.0
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tracking-wider">
            GLOBAL RISK INTELLIGENCE COMMAND CENTER
          </div>
        </div>
      </div>

      {/* Center Intelligence Telemetry Status */}
      <div className="hidden lg:flex items-center space-x-6 font-mono text-xs">
        <div className={`px-3 py-1 rounded border flex items-center space-x-2 font-semibold ${getThreatColor()}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>STATUS: {threatLevel}</span>
          <span className="text-xs opacity-75">
            ({riskOverview?.global_composite_risk || 0}/100)
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-300 bg-obsidian-900/60 px-3 py-1 rounded border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
          <span>ACTIVE INCIDENTS: <strong className="text-white">{riskOverview?.total_incidents || 0}</strong></span>
        </div>

        <div className="flex items-center space-x-2 text-slate-300 bg-obsidian-900/60 px-3 py-1 rounded border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>TIME: <span className="text-cyber-cyan">{utcTime}</span></span>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 text-xs font-mono text-slate-300 bg-obsidian-900 hover:bg-obsidian-850 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyber-cyan/50 transition-colors"
          title="Natural Language Intelligence Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-cyber-cyan" />
          <span className="hidden sm:inline">QUERY DESK</span>
          <kbd className="text-[10px] bg-obsidian-950 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">⌘K</kbd>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-slate-700 hover:border-cyber-cyan/50 text-slate-300 hover:text-cyber-cyan transition-colors"
          title="Refresh All Multi-Source Sensors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyber-cyan' : ''}`} />
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-cyber-green" />
          <span className="text-xs font-mono text-slate-300 hidden md:inline">SYSTEM ONLINE</span>
        </div>
      </div>
    </header>
  );
};
