import React, { useState } from 'react';
import { NormalizedEvent } from '../../types';
import { 
  X, 
  ExternalLink, 
  BookmarkPlus, 
  GitFork, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertTriangle,
  Globe,
  Radio,
  Layers,
  Activity,
  Compass
} from 'lucide-react';

interface EventDetailPanelProps {
  event: NormalizedEvent;
  onClose: () => void;
  onPinToCase: (event: NormalizedEvent) => void;
  onLaunchScenario: (event: NormalizedEvent) => void;
  onAskAI: (query: string) => void;
  onOrientGlobe?: (lat: number, lon: number) => void;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  onClose,
  onPinToCase,
  onLaunchScenario,
  onAskAI,
  onOrientGlobe
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showRawPayload, setShowRawPayload] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isCyber = event.domain === 'cybersecurity' || event.source === 'cisa_kev' || event.id.startsWith('cisa:');
  const isQuake = event.category === 'earthquake' || event.source === 'usgs';

  // Extract CVE identifier if available
  const cveMatch = event.title.match(/CVE-\d{4}-\d+/i) || event.source_id?.match(/CVE-\d{4}-\d+/i);
  const cveId = cveMatch ? cveMatch[0] : (isCyber && event.source_id ? event.source_id : null);

  // Vendor & Product
  const vendor = event.raw_payload?.vendor || event.score_breakdown?.vendor;
  const product = event.raw_payload?.product || event.score_breakdown?.product;
  const requiredAction = event.raw_payload?.action;

  // Advisory link fallback
  const advisoryUrl = event.source_url || (cveId ? `https://nvd.nist.gov/vuln/detail/${cveId}` : null);

  const handleCopyId = () => {
    const textToCopy = cveId || event.id;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCoords = event.latitude !== null && event.latitude !== undefined &&
                    event.longitude !== null && event.longitude !== undefined;

  return (
    <div 
      className="absolute top-20 right-6 bottom-24 w-full max-w-[410px] z-40 command-surface-elevated rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-subtle-surface border border-surface-border animate-fade-in"
      role="dialog"
      aria-labelledby="detail-panel-title"
    >
      {/* Scrollable Body */}
      <div className="overflow-y-auto pr-1 space-y-4">
        
        {/* Header: Status, Domain, Close */}
        <div className="flex items-start justify-between border-b border-surface-border pb-3">
          <div className="space-y-1 pr-2">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                event.severity === 'critical' ? 'bg-signal-red/20 text-signal-red border border-signal-red/30' :
                event.severity === 'high' ? 'bg-signal-amber/20 text-signal-amber border border-signal-amber/30' : 
                'bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/30'
              }`}>
                {event.severity}
              </span>
              <span className="text-[10px] font-mono text-content-muted uppercase">
                {event.domain.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-signal-green flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{event.verification_status || 'Verified'}</span>
              </span>
            </div>

            <h2 id="detail-panel-title" className="text-sm font-semibold text-content-primary leading-snug pt-1">
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close intelligence details"
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-subtle transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. CYBERSECURITY / CVE SPECIFIC INTELLIGENCE */}
        {isCyber && (
          <div className="space-y-3">
            {/* CVE Key Identifier & Exploitation Banner */}
            <div className="p-3 rounded-xl bg-signal-amber/10 border border-signal-amber/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-signal-amber flex-shrink-0" />
                  <span className="text-xs font-mono font-bold text-signal-amber">
                    {cveId || 'WEAPONIZED VULNERABILITY'}
                  </span>
                </div>
                {cveId && (
                  <button
                    onClick={handleCopyId}
                    aria-label="Copy CVE ID"
                    className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-subtle transition-colors flex items-center space-x-1 text-[10px] font-mono"
                  >
                    {copied ? <Check className="w-3 h-3 text-signal-green" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="text-[11px] font-sans text-content-secondary leading-relaxed">
                Active in the CISA Known Exploited Vulnerabilities (KEV) catalog. Weaponized in real-world threat campaigns.
              </div>
            </div>

            {/* Affected Vendor & Product */}
            {(vendor || product) && (
              <div className="p-3 rounded-xl bg-space/60 border border-surface-border text-xs font-mono space-y-1.5">
                <div className="text-[10px] text-content-muted uppercase tracking-wider">
                  TARGET ASSET ATTRIBUTION
                </div>
                <div className="flex justify-between items-center text-content-secondary">
                  <span>Vendor / Project:</span>
                  <span className="text-content-primary font-semibold">{vendor || 'Standard Software'}</span>
                </div>
                <div className="flex justify-between items-center text-content-secondary">
                  <span>Affected Product:</span>
                  <span className="text-content-primary font-semibold">{product || 'All Versions'}</span>
                </div>
              </div>
            )}

            {/* Required Action */}
            {requiredAction && (
              <div className="p-3 rounded-xl bg-space/80 border border-surface-border space-y-1 text-xs">
                <div className="text-[10px] font-mono text-signal-amber uppercase tracking-wider font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-signal-amber" />
                  <span>CISA MANDATORY REMEDIATION ACTION</span>
                </div>
                <p className="font-mono text-[11px] text-content-primary leading-normal">
                  {requiredAction}
                </p>
              </div>
            )}

            {/* Non-Geospatial Entity Notice */}
            <div className="p-2.5 rounded-xl bg-surface-subtle/70 border border-surface-border/50 text-[11px] font-mono text-content-muted flex items-start space-x-2">
              <Globe className="w-3.5 h-3.5 text-signal-cyan mt-0.5 flex-shrink-0" />
              <span>
                <strong>Global Cyber Asset:</strong> Non-geospatial entity. This threat vectors across distributed network infrastructures rather than a single physical location.
              </span>
            </div>
          </div>
        )}

        {/* 2. NATURAL HAZARD / GEOGRAPHIC TELEMETRY */}
        {hasCoords && (
          <div className="p-3 rounded-xl bg-space/60 border border-surface-border space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-content-secondary">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-signal-cyan" />
                <span>Geographic Target</span>
              </span>
              <span className="text-content-primary font-semibold">{event.region || 'Assigned Coordinates'}</span>
            </div>

            <div className="flex items-center justify-between text-content-secondary">
              <span>Coordinates</span>
              <span className="text-content-primary">
                {Math.abs(event.latitude!).toFixed(3)}°{event.latitude! >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(event.longitude!).toFixed(3)}°{event.longitude! >= 0 ? 'E' : 'W'}
              </span>
            </div>

            {event.depth_or_elevation !== null && event.depth_or_elevation !== undefined && (
              <div className="flex items-center justify-between text-content-secondary">
                <span>Depth / Elevation</span>
                <span className="text-content-primary">
                  {event.depth_or_elevation.toFixed(1)} km
                </span>
              </div>
            )}

            {onOrientGlobe && (
              <button
                onClick={() => onOrientGlobe(event.latitude!, event.longitude!)}
                className="w-full mt-2 py-1.5 rounded-lg bg-signal-cyan/15 hover:bg-signal-cyan/25 border border-signal-cyan/30 text-signal-cyan text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Orient 3D Earth to Incident</span>
              </button>
            )}
          </div>
        )}

        {/* Operational Synopsis & Intelligence Context */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-content-muted uppercase tracking-wider">
            OPERATIONAL ASSESSMENT & SYNOPSIS
          </div>
          <p className="text-xs font-sans text-content-secondary leading-relaxed bg-surface-subtle/40 p-3 rounded-xl border border-surface-border/50">
            {event.description || 'Active situational monitoring in effect. Ingested from verified primary sensors.'}
          </p>
        </div>

        {/* Chronological & Sensor Telemetry */}
        <div className="p-3 rounded-xl bg-space/60 border border-surface-border space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-content-secondary">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-content-muted" />
              <span>Timestamp</span>
            </span>
            <span className="text-content-primary">
              {event.occurrence_time ? new Date(event.occurrence_time).toLocaleString() : 'Continuous'}
            </span>
          </div>

          <div className="flex items-center justify-between text-content-secondary">
            <span>Primary Sensor Source</span>
            <span className="text-content-primary font-semibold uppercase">{event.source}</span>
          </div>

          <div className="flex items-center justify-between text-content-secondary">
            <span>Composite Risk Score</span>
            <span className="text-signal-cyan font-bold text-sm">
              {event.calculated_risk_score.toFixed(1)} / 100
            </span>
          </div>
        </div>

        {/* 3. EXPLAINABLE RISK MODEL METADATA */}
        <div className="border-t border-surface-border pt-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between py-1.5 text-xs font-mono text-content-muted hover:text-content-secondary transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-signal-cyan" />
              <span>EXPLAINABLE RISK MODEL</span>
            </span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="p-3 rounded-xl bg-space/80 border border-surface-border text-[11px] font-mono space-y-2 mt-1">
              <div className="flex justify-between text-content-secondary">
                <span>Severity Factor (40%):</span>
                <span className="text-content-primary">{event.score_breakdown?.severity_component ?? 'Standard'}</span>
              </div>
              <div className="flex justify-between text-content-secondary">
                <span>Exposure Factor (30%):</span>
                <span className="text-content-primary">{event.score_breakdown?.exposure_component ?? 'Standard'}</span>
              </div>
              <div className="flex justify-between text-content-secondary">
                <span>Vulnerability Factor (20%):</span>
                <span className="text-content-primary">{event.score_breakdown?.vulnerability_component ?? 'Standard'}</span>
              </div>
              <div className="flex justify-between text-content-secondary">
                <span>Sensor Confidence:</span>
                <span className="text-signal-green">{Math.round((event.confidence || 0.85) * 100)}%</span>
              </div>
              <div className="flex justify-between text-content-secondary border-t border-surface-border/50 pt-1.5">
                <span>Scoring Version:</span>
                <span className="text-content-muted">{event.scoring_version || 'v1.0.0'}</span>
              </div>

              {/* Raw JSON Inspector Toggle */}
              <button
                onClick={() => setShowRawPayload(!showRawPayload)}
                className="text-[10px] text-signal-cyan underline pt-1 block"
              >
                {showRawPayload ? 'Hide Raw Ingest Payload' : 'View Raw Ingest Payload'}
              </button>

              {showRawPayload && (
                <pre className="p-2 bg-space rounded text-[10px] overflow-x-auto text-content-secondary max-h-36">
                  {JSON.stringify(event.raw_payload || event, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actionable Operations Footer */}
      <div className="pt-3 border-t border-surface-border space-y-2 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPinToCase(event)}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-signal-cyan" />
            <span>Pin to Binder</span>
          </button>

          <button
            onClick={() => onLaunchScenario(event)}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-signal-amber" />
            <span>Simulate</span>
          </button>
        </div>

        <button
          onClick={() => onAskAI(`Analyze the tactical threat impact of ${event.title} (${event.id}). What are the immediate cascading vulnerabilities and mitigation priorities?`)}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-signal-cyan transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-signal-cyan" />
          <span>Ask AI Intelligence Desk</span>
        </button>

        {advisoryUrl ? (
          <a
            href={advisoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-surface-elevated hover:bg-surface-subtle border border-surface-border text-xs font-mono text-content-primary hover:text-signal-cyan transition-colors"
          >
            <span>Open Verified Advisory ({event.source.toUpperCase()})</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-signal-cyan" />
          </a>
        ) : (
          <div className="text-[11px] font-mono text-content-muted text-center py-1">
            No external advisory URL available for this record
          </div>
        )}
      </div>
    </div>
  );
};
