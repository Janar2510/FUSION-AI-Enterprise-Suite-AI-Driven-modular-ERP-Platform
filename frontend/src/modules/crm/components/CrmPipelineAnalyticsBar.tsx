import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useCRMStore, CrmAnalytics } from '../stores/crmStore';

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 min-w-[100px]">
      <div className="text-white/45 text-[10px] uppercase tracking-wide font-medium">{label}</div>
      <div className="text-white text-lg font-semibold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-white/35 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

function StageDistribution({ data }: { data: CrmAnalytics['stageBreakdown'] }) {
  const total = useMemo(() => data.reduce((s, x) => s + x.count, 0), [data]);
  if (total === 0) {
    return (
      <div className="text-white/30 text-xs py-1 text-center w-full rounded-md border border-white/5 bg-white/[0.02]">
        No active leads in pipeline
      </div>
    );
  }
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
        {data.map((s) => {
          const pct = (s.count / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.id}
              title={`${s.name}: ${s.count}`}
              className="bg-primary-500/80 first:rounded-l-full last:rounded-r-full min-w-[2px] transition-all"
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/50">
        {data
          .filter((s) => s.count > 0)
          .map((s) => (
            <span key={s.id}>
              <span className="text-white/70">{s.name}</span> ({s.count})
            </span>
          ))}
      </div>
    </div>
  );
}

/**
 * Pipeline summary from GET /api/crm/analytics (stored in crmStore after fetchPipeline / drag).
 */
export const CrmPipelineAnalyticsBar: React.FC = () => {
  const crmAnalytics = useCRMStore((s) => s.crmAnalytics);

  if (!crmAnalytics) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center gap-2 text-white/35 text-xs">
        <BarChart3 className="w-4 h-4 shrink-0 opacity-50" />
        Loading pipeline analytics…
      </div>
    );
  }

  const { totalLeads, openOpportunities, newThisMonth, avgDealSize, stageBreakdown } = crmAnalytics;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wide">
        <BarChart3 className="w-3.5 h-3.5" />
        Pipeline analytics
      </div>
      <div className="flex flex-wrap gap-2 items-stretch">
        <SummaryCard label="Active leads" value={totalLeads} />
        <SummaryCard label="Open opportunities" value={openOpportunities} />
        <SummaryCard label="New this month" value={newThisMonth} />
        <SummaryCard
          label="Avg deal size"
          value={avgDealSize > 0 ? `$${avgDealSize.toLocaleString()}` : '—'}
          sub="Expected revenue, active with value"
        />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="text-white/45 text-[10px] uppercase tracking-wide mb-2">Leads by stage</div>
        <StageDistribution data={stageBreakdown} />
      </div>
    </div>
  );
};
