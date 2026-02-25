import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { LucideIcon } from 'lucide-react';

interface MetricData {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  color: string;
}

interface ModuleMetricsCardProps {
  className?: string;
  title: string;
  metrics: MetricData[];
  loading?: boolean;
}

export const ModuleMetricsCard: React.FC<ModuleMetricsCardProps> = ({
  className = '',
  title,
  metrics,
  loading = false
}) => {
  const MetricCard = ({
    icon: Icon,
    label,
    value,
    change,
    color
  }: MetricData) => (
    <GlassCard className="p-4" gradient animated>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-xs font-medium">{label}</p>
          <p className="text-xl font-bold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
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
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </GlassCard>
  );
};
