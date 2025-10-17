import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'text-blue-400',
  onClick,
  className = '',
  delay = 0
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  const getTrendSymbol = () => {
    switch (trend) {
      case 'up':
        return '+';
      case 'down':
        return '-';
      default:
        return '';
    }
  };

  const CardComponent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color} bg-opacity-20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {getTrendSymbol()}{change}
            </span>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
          <p className="text-white/70 text-sm">{title}</p>
        </div>
      </GlassCard>
    </motion.div>
  );

  return CardComponent;
};

// Convenience component for metric grids
interface MetricGridProps {
  metrics: Omit<MetricCardProps, 'delay'>[];
  className?: string;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ 
  metrics, 
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" 
}) => {
  return (
    <div className={className}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={0.1 + index * 0.1}
        />
      ))}
    </div>
  );
};

