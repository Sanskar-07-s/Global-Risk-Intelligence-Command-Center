import React, { useState, useEffect } from 'react';
import { 
  Server, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle 
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
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-y-auto space-y-6 select-none bg-space">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-signal-green uppercase tracking-wider">
            DATA FUSION TELEMETRY // SENSOR REGISTRY
          </div>
          <h1 className="text-xl font-semibold text-content-primary mt-1">
            Real-Time Ingestion Connectors & Sensor Latency
          </h1>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isRefreshingAll}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-signal-cyan/20 hover:bg-signal-cyan/30 text-signal-cyan font-medium text-xs border border-signal-cyan/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
          <span>{isRefreshingAll ? 'Polling All Sensors...' : 'Refresh All Sources'}</span>
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
              className="command-surface p-5 rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isOperational ? 'bg-signal-green' : 'bg-signal-red'}`} />
                    <span className="text-xs font-mono font-semibold text-content-primary uppercase">
                      {src.source_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    isOperational ? 'bg-signal-green/20 text-signal-green' : 'bg-signal-red/20 text-signal-red'
                  }`}>
                    {src.status}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-content-primary mt-2">
                  {src.display_name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs font-mono text-content-secondary">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Domain:</span>
                    <span className="text-content-primary uppercase">{src.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Events Ingested:</span>
                    <span className="text-content-primary font-bold">{src.total_events_ingested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Round-trip Latency:</span>
                    <span className="text-content-primary">{src.latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Last Checked:</span>
                    <span className="text-content-muted">
                      {src.last_checked ? new Date(src.last_checked).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                </div>

                {src.error_message && (
                  <div className="mt-3 p-2.5 rounded-lg bg-signal-red/10 border border-signal-red/30 text-[11px] font-mono text-signal-red line-clamp-2">
                    {src.error_message}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-surface-border">
                <button
                  onClick={() => handleRefreshSingle(src.source_name)}
                  disabled={isSingleRefreshing}
                  className="w-full flex items-center justify-center space-x-2 py-1.5 rounded-lg bg-space hover:bg-surface-subtle text-xs font-mono text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSingleRefreshing ? 'animate-spin text-signal-cyan' : ''}`} />
                  <span>{isSingleRefreshing ? 'Polling Connector...' : 'Test & Ingest'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
