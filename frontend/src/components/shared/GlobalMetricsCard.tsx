import React, { useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Target, Briefcase, CalendarOff, Activity } from 'lucide-react';
import { GlassCard } from './GlassCard';

import { useCRMStore } from '@/modules/crm/stores/crmStore';
import { useSalesStore } from '@/modules/sales/stores/salesStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { useProjectStore } from '@/modules/project/stores/projectStore';
import { useLeavesStore } from '@/modules/leaves/stores/leavesStore';

interface GlobalMetricsCardProps {
  className?: string;
}

export const GlobalMetricsCard: React.FC<GlobalMetricsCardProps> = ({ className = '' }) => {
  // Pull data from across the ERP modules
  const { allLeads, fetchAllLeads } = useCRMStore();
  const { orders, fetchAllOrders } = useSalesStore();
  const { employees, fetchEmployees } = useHRStore();
  const { projects, fetchProjects } = useProjectStore();
  const { leaves, fetchLeaves } = useLeavesStore();

  useEffect(() => {
    fetchAllLeads();
    fetchAllOrders();
    fetchEmployees();
    fetchProjects();
    fetchLeaves();
  }, []);

  // Calculate live cross-module metrics
  const activeLeads = (allLeads || []).filter(l => l.stage?.name !== 'Won' && l.stage?.name !== 'Lost').length;
  const pipelineValue = (allLeads || []).filter(l => l.stage?.name !== 'Lost').reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);

  const totalSalesRevenue = (orders || []).reduce((sum, o) => sum + (o.amountTotal || 0), 0);
  const totalOrders = (orders || []).length;

  const activeEmployees = (employees || []).filter(e => e.active).length;
  const pendingLeaves = (leaves || []).filter(l => l.state === 'draft' || l.state === 'confirm').length;

  const activeProjects = (projects || []).length;

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    color
  }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    subtitle?: string;
    color: string;
  }) => (
    <GlassCard className="p-4 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1.5 font-mono tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-white/40 mt-1 truncate max-w-[120px]">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} shadow-lg flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </GlassCard>
  );

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-primary-500" />
        <h3 className="text-xl font-bold text-white">Live Cross-Module KPIs</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* CRM KPIs */}
        <MetricCard
          icon={Target}
          label="Active Leads"
          value={activeLeads.toString()}
          subtitle="Pipeline opportunities"
          color="from-blue-500 to-cyan-500"
        />
        <MetricCard
          icon={TrendingUp}
          label="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          subtitle="Expected revenue"
          color="from-amber-500 to-blue-600"
        />

        {/* Sales KPIs */}
        <MetricCard
          icon={DollarSign}
          label="Total Sales"
          value={`$${totalSalesRevenue.toLocaleString()}`}
          subtitle={`${totalOrders} confirmed orders`}
          color="from-green-500 to-emerald-600"
        />

        {/* HR KPIs */}
        <MetricCard
          icon={Users}
          label="Headcount"
          value={activeEmployees.toString()}
          subtitle="Active employees"
          color="from-amber-500 to-fuchsia-600"
        />
        <MetricCard
          icon={CalendarOff}
          label="Leave Requests"
          value={pendingLeaves.toString()}
          subtitle="Pending approvals"
          color="from-amber-500 to-orange-600"
        />

        {/* Project KPIs */}
        <MetricCard
          icon={Briefcase}
          label="Active Projects"
          value={activeProjects.toString()}
          subtitle="Billable/Client work"
          color="from-rose-500 to-red-600"
        />
      </div>
    </GlassCard>
  );
};