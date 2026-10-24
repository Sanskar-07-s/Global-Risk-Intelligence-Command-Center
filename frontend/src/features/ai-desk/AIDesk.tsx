import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { AICitedBrief } from '../../types';

export const AIDesk: React.FC = () => {
  const [question, setQuestion] = useState('Provide an operational intelligence brief on recent severe seismic activities and weaponized cyber vulnerabilities.');
  const [region, setRegion] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [brief, setBrief] = useState<AICitedBrief | null>(null);

  const samplePrompts = [
    "Assess compound supply chain vulnerabilities in the Red Sea corridor.",
    "Summarize critical CISA KEV remote code execution vulnerabilities.",
    "Evaluate seismic hazard exposure in the Pacific Ring of Fire.",
    "Explain the risk drivers contributing to current global elevated status."
  ];

  const handleQuery = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.queryIntelligence(q, region || undefined, domain || undefined);
      setBrief(res);
    } catch (err) {
      console.error("AI Desk query error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-y-auto space-y-6 select-none bg-space">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono text-signal-cyan uppercase tracking-wider">
          AI INTELLIGENCE DESK // EVIDENCE-GROUNDED SYNTHESIS
        </div>
        <h1 className="text-xl font-semibold text-content-primary mt-1">
          Gemini Intelligence Analyst & Cited Brief Synthesizer
        </h1>
      </div>

      {/* Query Bar */}
      <div className="command-surface p-4 rounded-xl space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask an analytical intelligence question grounded in live sensor data..."
            className="flex-1 text-xs font-sans bg-space border border-surface-border rounded-lg px-3.5 py-2.5 text-content-primary placeholder-content-muted focus:outline-none focus:border-surface-border-active"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={() => handleQuery()}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2.5 rounded-lg bg-signal-cyan/20 hover:bg-signal-cyan/30 text-signal-cyan font-semibold text-xs border border-signal-cyan/40 flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing...' : 'Generate Brief'}</span>
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-content-muted mr-1">QUICK INQUIRIES:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(p);
                handleQuery(p);
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-space hover:bg-surface-subtle text-content-secondary hover:text-content-primary border border-surface-border transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Brief Output */}
      {brief && (
        <div className="space-y-6">
          <div className="command-surface p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-signal-cyan" />
                <span className="text-xs font-mono font-semibold text-content-primary uppercase">
                  GROUNDED OPERATIONAL ASSESSMENT
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-signal-green/20 text-signal-green">
                CONFIDENCE: {brief.confidence_level}
              </span>
            </div>

            <p className="text-sm font-sans text-content-secondary leading-relaxed">
              {brief.summary}
            </p>

            {/* Key Findings */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-content-muted uppercase">
                VERIFIED KEY FINDINGS (WITH GROUNDED SOURCE CITATIONS)
              </div>
              <ul className="space-y-1.5">
                {brief.key_findings.map((f, i) => (
                  <li key={i} className="text-xs font-sans text-content-primary flex items-start space-x-2">
                    <CheckCircle className="w-3.5 h-3.5 text-signal-cyan flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Postures */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-content-muted uppercase">
                RECOMMENDED OPERATIONAL ACTIONS
              </div>
              <ul className="space-y-1.5">
                {brief.recommended_actions.map((act, i) => (
                  <li key={i} className="text-xs font-sans text-content-secondary flex items-start space-x-2">
                    <ArrowRight className="w-3.5 h-3.5 text-signal-amber flex-shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stated Gaps & Missing Evidence */}
            {brief.missing_evidence && brief.missing_evidence.length > 0 && (
              <div className="p-3 rounded-xl bg-space border border-surface-border space-y-1 text-xs">
                <div className="text-content-muted font-mono text-[10px] uppercase flex items-center space-x-1.5">
                  <AlertCircle className="w-3 h-3 text-content-muted" />
                  <span>IDENTIFIED UNCERTAINTIES & EVIDENCE GAPS</span>
                </div>
                <ul className="list-disc list-inside text-content-secondary text-[11px] font-mono space-y-0.5">
                  {brief.missing_evidence.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sourced Citations Grid */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-content-muted uppercase">
              ATTACHED SOURCE CITATIONS ({brief.citations.length} VERIFIED NODES)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brief.citations.map((cite, i) => (
                <div key={i} className="command-surface p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-signal-cyan font-semibold">[{cite.citation_id}]</span>
                    <span className="text-content-muted">{cite.source.toUpperCase()}</span>
                  </div>
                  <div className="text-content-primary font-medium text-xs line-clamp-1">
                    {cite.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-content-muted pt-1 border-t border-surface-border">
                    <span>Risk: {cite.risk_score}</span>
                    {cite.url && (
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-signal-cyan hover:underline flex items-center space-x-1"
                      >
                        <span>Advisory</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
