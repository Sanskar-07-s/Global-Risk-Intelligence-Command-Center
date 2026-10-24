import React, { useState, useEffect } from 'react';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity,
  Database
} from 'lucide-react';
import { api } from '../../services/api';
import { SourceHealth } from '../../types';

export const DataHealth: React.FC = () => {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [refreshingSource, setRefreshingSource] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const fetchSourceHealth = () => {
    api.getSources().then(data => setSources(data)).catch(console.error);
  };

  useEffect(() => {
    fetchSourceHealth();
    const interval = setInterval(fetchSourceHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshSingle = async (name: string) => {
    setRefreshingSource(name);
    try {
      await api.refreshSource(name);
      fetchSourceHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingSource(null);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await api.refreshSource();
      fetchSourceHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-6 overflow-y-auto space-y-6 select-none">
      {/* Top Banner */}
      <div className="p-4 rounded-xl glass-panel-glow border-cyber-cyan/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40 text-cyber-cyan">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyber-cyan uppercase tracking-wider">
              DATA FUSION & SYSTEM HEALTH // REGISTRY TELEMETRY
            </div>
            <h1 className="text-lg font-bold text-white">
              Multi-Source Ingestion Pipeline Telemetry & Connectors
            </h1>
          </div>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyber-cyan hover:bg-cyber-cyan/80 text-obsidian-950 font-bold text-xs font-mono tracking-wider transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
          <span>{isRefreshingAll ? 'SYNCING ALL SENSORS...' : 'REFRESH ALL SOURCES'}</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => {
          const isOperational = src.status === 'operational';
          const isSingleRefreshing = refreshingSource === src.source_name;

          return (
            <div
              key={src.source_name}
              className="p-5 rounded-xl glass-panel border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOperational ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      {src.source_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    isOperational ? 'bg-cyber-green/15 text-cyber-green border-cyber-green/30' : 'bg-cyber-red/15 text-cyber-red border-cyber-red/30'
                  }`}>
                    {src.status}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-200 mt-2 font-sans">
                  {src.display_name}
                </div>

                <div className="mt-3 space-y-1.5 text-xs font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Domain:</span>
                    <span className="text-cyber-cyan uppercase">{src.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Events Ingested:</span>
                    <span className="text-slate-100 font-bold">{src.total_events_ingested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Polling Latency:</span>
                    <span className="text-slate-100">{src.latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Checked:</span>
                    <span className="text-slate-400">
                      {src.last_checked ? new Date(src.last_checked).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                </div>

                {src.error_message && (
                  <div className="mt-3 p-2 rounded bg-cyber-red/10 border border-cyber-red/30 text-[11px] font-mono text-cyber-red line-clamp-2">
                    {src.error_message}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleRefreshSingle(src.source_name)}
                  disabled={isSingleRefreshing}
                  className="w-full flex items-center justify-center space-x-2 py-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyber-cyan transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSingleRefreshing ? 'animate-spin text-cyber-cyan' : ''}`} />
                  <span>{isSingleRefreshing ? 'POLLING API...' : 'TEST & REFRESH'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
