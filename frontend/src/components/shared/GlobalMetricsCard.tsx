import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Target, Package, Clock } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useGlobalMetricsStore } from '@/stores/globalMetricsStore';

interface GlobalMetricsCardProps {
  className?: string;
}

export const GlobalMetricsCard: React.FC<GlobalMetricsCardProps> = ({ className = '' }) => {
  const { metrics, fetchGlobalMetrics, loading } = useGlobalMetricsStore();

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    color 
  }: { 
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    change?: number;
    color: string;
  }) => (
    <GlassCard className="p-4" gradient animated>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-xs font-medium">{label}</p>
          <p className="text-xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              change > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {change > 0 ? '↗' : '↘'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4">Global Metrics</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={Users}
          label="Total Contacts"
          value={metrics?.total_contacts?.toLocaleString() || '0'}
          change={metrics?.contacts_growth}
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          icon={Target}
          label="Qualified Leads"
          value={metrics?.qualified_leads?.toLocaleString() || '0'}
          change={metrics?.leads_growth}
          color="from-green-500 to-green-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Pipeline Value"
          value={`$${metrics?.pipeline_value?.toLocaleString() || '0'}`}
          change={metrics?.pipeline_growth}
          color="from-purple-500 to-purple-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Win Rate"
          value={`${metrics?.win_rate || '0'}%`}
          change={metrics?.win_rate_change}
          color="from-orange-500 to-orange-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue"
          value={`$${metrics?.total_revenue?.toLocaleString() || '0'}`}
          change={metrics?.revenue_growth}
          color="from-teal-500 to-teal-600"
        />
        <MetricCard
          icon={Package}
          label="Low Stock Items"
          value={metrics?.low_stock_items?.toLocaleString() || '0'}
          color="from-red-500 to-red-600"
        />
      </div>
    </GlassCard>
  );
};