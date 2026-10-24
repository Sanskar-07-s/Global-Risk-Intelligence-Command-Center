import React, { useState, useEffect, useRef } from 'react';
import { NormalizedEvent, CorrelationLink } from '../../types';
import { Share2, Info, Filter, Compass } from 'lucide-react';
import { api } from '../../services/api';

interface KnowledgeGraphProps {
  events: NormalizedEvent[];
  onSelectEvent: (ev: NormalizedEvent) => void;
}

interface Node {
  id: string;
  label: string;
  domain: string;
  riskScore: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  events,
  onSelectEvent
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [correlations, setCorrelations] = useState<CorrelationLink[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<CorrelationLink | null>(null);
  const [filterNature, setFilterNature] = useState<'all' | 'inferred' | 'sourced'>('all');

  useEffect(() => {
    api.getCorrelations().then(data => {
      setCorrelations(data.links || []);
      if (data.links && data.links.length > 0) {
        setSelectedEdge(data.links[0]);
      }
    }).catch(err => {
      console.warn("Failed fetching correlations:", err);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    // Build nodes from top 35 active events
    const sampleEvents = events.slice(0, 35);
    const nodes: Node[] = sampleEvents.map((ev, i) => {
      const angle = (i / sampleEvents.length) * 2 * Math.PI;
      const radius = 160 + (Math.sin(i * 1.5) * 80);
      return {
        id: ev.id,
        label: ev.title.length > 22 ? ev.title.substring(0, 22) + '...' : ev.title,
        domain: ev.domain,
        riskScore: ev.calculated_risk_score,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle background orbital grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
      ctx.arc(width / 2, height / 2, 240, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Correlation Edges
      correlations.forEach(edge => {
        if (filterNature !== 'all' && edge.nature !== filterNature) return;
        const src = nodes.find(n => n.id === edge.source_id);
        const tgt = nodes.find(n => n.id === edge.target_id);
        if (src && tgt) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);

          const isSelected = selectedEdge?.source_id === edge.source_id && selectedEdge?.target_id === edge.target_id;
          
          if (edge.relationship === 'cross_domain_compound_risk') {
            ctx.strokeStyle = isSelected ? '#FF626B' : 'rgba(255, 98, 107, 0.25)';
            ctx.setLineDash([3, 3]);
          } else {
            ctx.strokeStyle = isSelected ? '#72DDFB' : 'rgba(114, 221, 251, 0.2)';
            ctx.setLineDash([]);
          }
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        ctx.beginPath();
        const r = 5 + (node.riskScore / 25);
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        let fill = '#A5C4D4';
        if (node.domain === 'geopolitical') fill = '#FF626B';
        else if (node.domain === 'cybersecurity') fill = '#FFBD69';
        else if (node.domain === 'natural_hazard') fill = '#72DDFB';

        ctx.fillStyle = fill;
        ctx.fill();

        // Label (Clean Sans)
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(242, 245, 250, 0.7)';
        ctx.fillText(node.label, node.x + r + 5, node.y + 3);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [events, correlations, filterNature, selectedEdge]);

  return (
    <div className="w-full h-full flex overflow-hidden select-none bg-space pt-20 pl-20">
      {/* Canvas Area */}
      <div className="flex-1 h-full relative">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

        {/* Minimalist Legend Overlay */}
        <div className="absolute top-6 left-6 command-surface-elevated p-3 rounded-xl text-xs font-mono space-y-1.5 shadow-subtle-surface">
          <div className="text-content-primary font-semibold mb-1 flex items-center space-x-1.5">
            <Share2 className="w-3.5 h-3.5 text-signal-cyan" />
            <span>TOPOLOGY NETWORK</span>
          </div>
          <div className="flex items-center space-x-2 text-content-secondary text-[11px]">
            <span className="w-2 h-2 rounded-full bg-signal-red" />
            <span>Geopolitical Inferred Link</span>
          </div>
          <div className="flex items-center space-x-2 text-content-secondary text-[11px]">
            <span className="w-2 h-2 rounded-full bg-signal-amber" />
            <span>Cyber Threat Entity</span>
          </div>
          <div className="flex items-center space-x-2 text-content-secondary text-[11px]">
            <span className="w-2 h-2 rounded-full bg-signal-cyan" />
            <span>Natural Hazard Cluster</span>
          </div>
        </div>

        {/* Nature Filter Pill */}
        <div className="absolute top-6 right-6">
          <select
            value={filterNature}
            onChange={(e) => setFilterNature(e.target.value as any)}
            className="command-surface-elevated text-xs font-mono rounded-xl px-3 py-1.5 text-content-secondary focus:outline-none focus:border-surface-border-active"
          >
            <option value="all">All Edges (Inferred + Sourced)</option>
            <option value="inferred">Inferred Compound Clusters</option>
            <option value="sourced">Verified Direct Links</option>
          </select>
        </div>
      </div>

      {/* Right Edge Relationship Dossier */}
      <div className="w-80 lg:w-96 h-full command-surface-elevated border-l border-surface-border p-5 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-mono text-signal-cyan uppercase tracking-wider">
            EDGE CORRELATION TELEMETRY
          </div>
          <h2 className="text-sm font-semibold text-content-primary mt-1">
            Spatial Proximity & Sector Couplings
          </h2>
        </div>

        <div className="text-xs text-content-secondary font-sans leading-relaxed p-3 rounded-xl bg-space border border-surface-border">
          <strong className="text-signal-amber font-mono text-[11px]">Provenance Doctrine:</strong> Inferred relationships are computed using spherical Haversine proximity (&lt;650km) and shared critical infrastructure corridors.
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono text-content-muted uppercase">
            CORRELATION EDGES ({correlations.length})
          </div>

          <div className="space-y-2">
            {correlations.slice(0, 15).map((corr, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEdge(corr)}
                className={`p-3 rounded-xl text-xs cursor-pointer transition-all ${
                  selectedEdge === corr
                    ? 'bg-surface-subtle border border-signal-cyan/40 shadow-cyan-glow'
                    : 'bg-space/80 hover:bg-space border border-surface-border'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-signal-cyan uppercase font-semibold">
                    {corr.relationship.replace(/_/g, ' ')}
                  </span>
                  <span className="text-content-muted">
                    {corr.nature.toUpperCase()}
                  </span>
                </div>
                <p className="text-content-secondary font-sans text-xs mt-1 leading-snug">
                  {corr.description}
                </p>
                <div className="flex justify-between text-[10px] font-mono text-content-muted mt-2 pt-1.5 border-t border-surface-border">
                  <span>Confidence: {Math.round(corr.confidence * 100)}%</span>
                  {corr.distance_km && <span>Distance: {corr.distance_km}km</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
