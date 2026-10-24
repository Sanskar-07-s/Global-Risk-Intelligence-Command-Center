import React from 'react';
import ReactECharts from 'echarts-for-react';
import { NormalizedEvent, RiskOverview } from '../../types';
import { BarChart3, PieChart, ShieldCheck } from 'lucide-react';

interface RiskAnalyticsProps {
  events: NormalizedEvent[];
  riskOverview: RiskOverview | null;
}

export const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({
  events,
  riskOverview
}) => {
  // Domain distribution bar chart
  const domainCounts = riskOverview?.domain_breakdown || {};
  const domainChartOption = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0B1018',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#F2F5FA', fontSize: 11 }
    },
    grid: { top: '15%', left: '4%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Object.keys(domainCounts).map(d => d.replace('_', ' ').toUpperCase()),
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: '#8D9AAA', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.04)' } },
      axisLabel: { color: '#8D9AAA', fontSize: 10 }
    },
    series: [
      {
        name: 'Active Incidents',
        type: 'bar',
        data: Object.values(domainCounts),
        itemStyle: {
          color: '#72DDFB',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  // Severity ratio doughnut
  const severityCounts = riskOverview?.severity_breakdown || {};
  const severityChartOption = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'item',
      backgroundColor: '#0B1018',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#F2F5FA', fontSize: 11 }
    },
    legend: {
      bottom: '2%',
      textStyle: { color: '#8D9AAA', fontSize: 10 }
    },
    series: [
      {
        name: 'Severity Tiers',
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: severityCounts.critical || 0, name: 'Critical', itemStyle: { color: '#FF626B' } },
          { value: severityCounts.high || 0, name: 'High', itemStyle: { color: '#FFBD69' } },
          { value: severityCounts.medium || 0, name: 'Medium', itemStyle: { color: '#72DDFB' } },
          { value: severityCounts.low || 0, name: 'Low', itemStyle: { color: '#A5C4D4' } },
        ]
      }
    ]
  };

  return (
    <div className="w-full h-full p-8 pt-24 pl-24 overflow-y-auto space-y-6 select-none bg-space">
      {/* Top Header */}
      <div>
        <div className="text-[11px] font-mono text-signal-cyan uppercase tracking-wider">
          RISK ANALYTICS // EXPLAINABLE COMPOSITE ENGINE
        </div>
        <h1 className="text-xl font-semibold text-content-primary mt-1">
          Global Risk Index & Multi-Domain Distribution
        </h1>
      </div>

      {/* Primary Signal Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="command-surface p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-content-muted uppercase">
            GLOBAL COMPOSITE RISK
          </div>
          <div className="text-2xl font-semibold text-signal-cyan font-mono">
            {riskOverview?.global_composite_risk || 0} <span className="text-xs text-content-muted font-normal">/ 100</span>
          </div>
          <div className="text-[10px] font-mono text-content-muted">
            STATUS: {riskOverview?.threat_level || 'ELEVATED'}
          </div>
        </div>

        <div className="command-surface p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-content-muted uppercase">
            CRITICAL INCIDENTS
          </div>
          <div className="text-2xl font-semibold text-signal-red font-mono">
            {riskOverview?.critical_count || 0}
          </div>
          <div className="text-[10px] font-mono text-content-muted">
            IMMEDIATE VIGILANCE TIER
          </div>
        </div>

        <div className="command-surface p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-content-muted uppercase">
            HIGH SEVERITY EVENTS
          </div>
          <div className="text-2xl font-semibold text-signal-amber font-mono">
            {riskOverview?.high_count || 0}
          </div>
          <div className="text-[10px] font-mono text-content-muted">
            ACTIVE WATCHLIST CORRIDORS
          </div>
        </div>

        <div className="command-surface p-4 rounded-xl space-y-1">
          <div className="text-[11px] font-mono text-content-muted uppercase">
            TOTAL FUSED SENSOR EVENTS
          </div>
          <div className="text-2xl font-semibold text-signal-green font-mono">
            {riskOverview?.total_incidents || events.length}
          </div>
          <div className="text-[10px] font-mono text-content-muted">
            USGS, EONET, CISA, OPEN-METEO
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="command-surface p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-content-primary">
            <BarChart3 className="w-4 h-4 text-signal-cyan" />
            <span>INCIDENT DISTRIBUTION BY DOMAIN</span>
          </div>
          <div className="h-64">
            <ReactECharts option={domainChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="command-surface p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-content-primary">
            <PieChart className="w-4 h-4 text-signal-cyan" />
            <span>GLOBAL SEVERITY RATIO</span>
          </div>
          <div className="h-64">
            <ReactECharts option={severityChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Explainable Scoring Methodology Specification */}
      <div className="command-surface p-5 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-content-primary">
          <ShieldCheck className="w-4 h-4 text-signal-cyan" />
          <span>EXPLAINABLE RISK SCORING FORMULATION (METHODOLOGY v1.0.0-MULTI-FACTOR)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-space border border-surface-border space-y-1">
            <div className="font-mono text-signal-cyan text-[11px] font-semibold">1. Severity Magnitude (40%)</div>
            <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
              Normalizes earthquake magnitude, CISA active exploitation in the wild, and meteorological anomaly indices.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-space border border-surface-border space-y-1">
            <div className="font-mono text-signal-cyan text-[11px] font-semibold">2. Geographic Exposure (30%)</div>
            <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
              Calculates proximity to international shipping straits, dense metropolitan hubs, and container terminals.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-space border border-surface-border space-y-1">
            <div className="font-mono text-signal-cyan text-[11px] font-semibold">3. Infrastructure Fragility (20%)</div>
            <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
              World Bank macroeconomic resilience metrics and regional supply chain dependency factors.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-space border border-surface-border space-y-1">
            <div className="font-mono text-signal-cyan text-[11px] font-semibold">4. Recency Decay (10%)</div>
            <p className="text-content-secondary font-sans text-[11px] leading-relaxed">
              72-hour half-life exponential decay function for acute kinetic disruptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
