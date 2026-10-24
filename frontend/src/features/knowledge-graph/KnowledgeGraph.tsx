import React, { useState, useEffect, useRef } from 'react';
import { NormalizedEvent, CorrelationLink } from '../../types';
import { Share2, Info, Filter, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filterNature, setFilterNature] = useState<'all' | 'inferred' | 'sourced'>('all');

  useEffect(() => {
    api.getCorrelations().then(data => {
      setCorrelations(data.links || []);
    }).catch(err => {
      console.warn("Failed fetching correlations:", err);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.parentElement?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    // Create graph nodes from top events
    const sampleEvents = events.slice(0, 40);
    const nodes: Node[] = sampleEvents.map((ev, i) => {
      const angle = (i / sampleEvents.length) * 2 * Math.PI;
      const radius = 180 + (Math.random() * 120);
      return {
        id: ev.id,
        label: ev.title.length > 25 ? ev.title.substring(0, 25) + '...' : ev.title,
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

      // Draw Edges
      correlations.forEach(edge => {
        if (filterNature !== 'all' && edge.nature !== filterNature) return;
        const src = nodes.find(n => n.id === edge.source_id);
        const tgt = nodes.find(n => n.id === edge.target_id);
        if (src && tgt) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          
          if (edge.relationship === 'cross_domain_compound_risk') {
            ctx.strokeStyle = 'rgba(255, 0, 84, 0.45)'; // red dashed
            ctx.setLineDash([4, 4]);
          } else {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'; // cyan
            ctx.setLineDash([]);
          }
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        ctx.beginPath();
        const r = 6 + (node.riskScore / 20);
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        // Node color by domain
        let fill = '#70d6ff';
        if (node.domain === 'geopolitical') fill = '#ff0054';
        else if (node.domain === 'cybersecurity') fill = '#ffb703';
        else if (node.domain === 'natural_hazard') fill = '#00f0ff';

        ctx.fillStyle = fill;
        ctx.shadowColor = fill;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.fillText(node.label, node.x + r + 4, node.y + 3);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [events, correlations, filterNature]);

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex overflow-hidden select-none relative">
      {/* Canvas */}
      <div className="flex-1 h-full relative bg-obsidian-950 tactical-grid">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

        {/* Legend */}
        <div className="absolute top-4 left-4 p-3 rounded-lg glass-panel text-xs font-mono space-y-1.5 border border-slate-700">
          <div className="font-semibold text-cyber-cyan mb-1 flex items-center space-x-1.5">
            <Share2 className="w-4 h-4" />
            <span>KNOWLEDGE GRAPH TOPOLOGY</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-red" />
            <span>Geopolitical Inferred Link</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-amber" />
            <span>Cyber Threat Entity</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan" />
            <span>Natural Hazard / Kinetic</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <select
            value={filterNature}
            onChange={(e) => setFilterNature(e.target.value as any)}
            className="text-xs font-mono bg-obsidian-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-cyber-cyan"
          >
            <option value="all">All Edges (Inferred + Sourced)</option>
            <option value="inferred">Inferred Proximity Clusters</option>
            <option value="sourced">Verified Direct Links</option>
          </select>
        </div>
      </div>

      {/* Right Edge & Relationship Telemetry */}
      <div className="w-80 lg:w-96 h-full glass-panel border-l border-cyber-cyan/20 p-4 space-y-4 overflow-y-auto">
        <div className="text-xs font-mono text-cyber-cyan tracking-wider uppercase flex items-center space-x-2">
          <Info className="w-4 h-4" />
          <span>RELATIONSHIP VERIFICATION</span>
        </div>

        <div className="text-xs text-slate-300 font-sans leading-relaxed p-3 rounded-lg bg-obsidian-900/60 border border-slate-800">
          <strong className="text-cyber-amber">Doctrine:</strong> All graph links represent spatial proximity, temporal co-occurrence, or shared sector exposure. Inferred connections are explicitly distinguished from sourced facts.
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400">
            ACTIVE CORRELATION EDGES ({correlations.length})
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {correlations.slice(0, 15).map((corr, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-obsidian-900/90 border border-slate-800 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30">
                    {corr.relationship.toUpperCase()}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    NATURE: {corr.nature.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-200 text-[11px] font-sans">
                  {corr.description}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
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
