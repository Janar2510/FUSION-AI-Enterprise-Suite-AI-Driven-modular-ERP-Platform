import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useCRMStore, CrmAnalytics } from '../stores/crmStore';
import { useAuth } from '@/contexts/AuthContext';
import { crmApi } from '@/lib/api';

function isCrmManager(roles: string[] | undefined): boolean {
  const r = roles?.length ? roles : [];
  return r.some((x) => ['admin', 'Administrator', 'manager', 'Manager'].includes(x));
}

function crmAccessHint(roles: string[] | undefined): string {
  return isCrmManager(roles)
    ? 'CRM visibility: all leads (manager / admin). Use owner filter to narrow.'
    : 'CRM visibility: your assigned leads and unassigned leads.';
}

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
          const w =
            s.weightedPipeline != null && s.weightedPipeline > 0
              ? ` — weighted $${s.weightedPipeline.toLocaleString()}`
              : '';
          return (
            <div
              key={s.id}
              title={`${s.name}: ${s.count}${w}`}
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
              <span className="text-white/70">{s.name}</span> ({s.count}
              {s.pipelineValue != null && s.pipelineValue > 0
                ? ` · $${s.pipelineValue.toLocaleString()}`
                : ''}
              )
            </span>
          ))}
      </div>
    </div>
  );
}

type Salesperson = { id: string; name: string; email: string };

/**
 * Pipeline summary from GET /api/crm/analytics (stored in crmStore after fetchPipeline / drag).
 */
export const CrmPipelineAnalyticsBar: React.FC = () => {
  const crmAnalytics = useCRMStore((s) => s.crmAnalytics);
  const crmScopeUserId = useCRMStore((s) => s.crmScopeUserId);
  const setCrmScopeUserId = useCRMStore((s) => s.setCrmScopeUserId);
  const { user } = useAuth();
  const [salespeople, setSalespeople] = useState<Salesperson[] | null>(null);

  const manager = isCrmManager(user?.roles);

  useEffect(() => {
    if (!manager) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await crmApi.salespeople();
        if (!cancelled) setSalespeople(res.data as Salesperson[]);
      } catch {
        if (!cancelled) setSalespeople([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manager]);

  if (!crmAnalytics) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center gap-2 text-white/35 text-xs">
        <BarChart3 className="w-4 h-4 shrink-0 opacity-50" />
        Loading pipeline analytics…
      </div>
    );
  }

  const {
    totalLeads,
    openOpportunities,
    newThisMonth,
    avgDealSize,
    weightedPipeline = 0,
    wonThisMonth = 0,
    lostThisMonth = 0,
    stageBreakdown,
    wonLostTrend = [],
    revenueByOwner = [],
  } = crmAnalytics;

  const trendMax = useMemo(() => {
    let m = 1;
    for (const t of wonLostTrend) {
      m = Math.max(m, t.won + t.lost);
    }
    return m;
  }, [wonLostTrend]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wide">
          <BarChart3 className="w-3.5 h-3.5" />
          Pipeline analytics
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {manager && salespeople && salespeople.length > 0 && (
            <label className="flex items-center gap-2 text-[10px] text-white/45">
              <span className="shrink-0">Owner scope</span>
              <select
                className="bg-white/10 border border-white/15 rounded-md px-2 py-1 text-white text-xs max-w-[220px]"
                value={crmScopeUserId ?? ''}
                onChange={(e) =>
                  setCrmScopeUserId(e.target.value ? e.target.value : undefined)
                }
              >
                <option value="">All owners (org)</option>
                {salespeople.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name || sp.email}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="text-white/40 text-[10px] leading-snug max-w-xl sm:text-right">
            {crmAccessHint(user?.roles)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-stretch">
        <SummaryCard label="Active leads" value={totalLeads} />
        <SummaryCard label="Open opportunities" value={openOpportunities} />
        <SummaryCard label="New this month" value={newThisMonth} />
        <SummaryCard
          label="Weighted forecast"
          value={weightedPipeline > 0 ? `$${weightedPipeline.toLocaleString()}` : '—'}
          sub="Σ revenue × probability (active)"
        />
        <SummaryCard label="Won (MTD)" value={wonThisMonth} sub="Closed-won this month" />
        <SummaryCard label="Lost (MTD)" value={lostThisMonth} sub="Inactive updated this month" />
        <SummaryCard
          label="Win rate (MTD)"
          value={
            wonThisMonth + lostThisMonth > 0
              ? `${Math.round((wonThisMonth / (wonThisMonth + lostThisMonth)) * 100)}%`
              : '—'
          }
          sub="Won ÷ (won + lost)"
        />
        <SummaryCard
          label="Avg deal size"
          value={avgDealSize > 0 ? `$${avgDealSize.toLocaleString()}` : '—'}
          sub="Expected revenue, active with value"
        />
      </div>

      {wonLostTrend.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 overflow-x-auto">
          <div className="text-white/45 text-[10px] uppercase tracking-wide mb-2">Won / lost (12 mo)</div>
          <div className="flex items-end gap-1 min-h-[72px]">
            {wonLostTrend.map((t) => {
              const hWon = trendMax > 0 ? Math.round((t.won / trendMax) * 100) : 0;
              const hLost = trendMax > 0 ? Math.round((t.lost / trendMax) * 100) : 0;
              return (
                <div key={t.month} className="flex flex-col items-center gap-0.5 shrink-0" title={`${t.month}: won ${t.won}, lost ${t.lost}`}>
                  <div className="flex items-end gap-0.5 h-14">
                    <div
                      className="w-2 rounded-sm bg-emerald-500/80 min-h-[2px]"
                      style={{ height: `${Math.max(4, hWon)}%` }}
                    />
                    <div
                      className="w-2 rounded-sm bg-red-400/70 min-h-[2px]"
                      style={{ height: `${Math.max(4, hLost)}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-white/35 tabular-nums">{t.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-white/35 mt-1">Green = won · Red = lost (per month)</div>
        </div>
      )}

      {revenueByOwner.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 overflow-x-auto">
          <div className="text-white/45 text-[10px] uppercase tracking-wide mb-2">Pipeline by owner</div>
          <table className="w-full text-left text-[11px] text-white/75">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="py-1 pr-2 font-medium">Owner</th>
                <th className="py-1 pr-2 font-medium text-right">Leads</th>
                <th className="py-1 pr-2 font-medium text-right">Value</th>
                <th className="py-1 font-medium text-right">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {revenueByOwner.slice(0, 12).map((row) => (
                <tr key={row.userId ?? 'unassigned'} className="border-b border-white/5">
                  <td className="py-1.5 pr-2">{row.name || '—'}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{row.leadCount}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    ${row.pipelineValue.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    ${row.weightedPipeline.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="text-white/45 text-[10px] uppercase tracking-wide mb-2">Leads by stage</div>
        <StageDistribution data={stageBreakdown} />
      </div>
    </div>
  );
};
