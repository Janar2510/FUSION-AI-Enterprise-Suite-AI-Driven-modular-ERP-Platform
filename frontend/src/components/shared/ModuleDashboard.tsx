import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { MetricGrid } from './MetricCard';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'pink';
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface RecentItem {
  id: string | number;
  title: string;
  subtitle?: string;
  status?: string;
  date?: string;
  amount?: string | number;
}

interface ModuleDashboardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  metrics: MetricCard[];
  charts?: {
    title: string;
    data: ChartData[];
    type: 'bar' | 'line' | 'pie' | 'donut';
  }[];
  recentItems?: {
    title: string;
    items: RecentItem[];
    onViewAll?: () => void;
  };
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }[];
  className?: string;
}

const colorClasses = {
  purple: 'text-purple-400 bg-purple-400/10',
  blue: 'text-blue-400 bg-blue-400/10',
  green: 'text-green-400 bg-green-400/10',
  orange: 'text-orange-400 bg-orange-400/10',
  red: 'text-red-400 bg-red-400/10',
  pink: 'text-pink-400 bg-pink-400/10',
};

const changeTypeClasses = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-gray-400',
};

export const ModuleDashboard: React.FC<ModuleDashboardProps> = ({
  title,
  subtitle,
  icon: Icon,
  metrics,
  charts = [],
  recentItems,
  actions = [],
  className = '',
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen p-6 space-y-6 ${className}`}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Icon className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {actions.length > 0 && (
          <div className="flex space-x-3">
            {actions.map((action, index) => (
              <GradientButton
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'primary'}
                size="md"
              >
                {action.label}
              </GradientButton>
            ))}
          </div>
        )}
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants}>
        <MetricGrid
          metrics={metrics.map((metric, index) => ({
            title: metric.title,
            value: metric.value,
            change: metric.change,
            trend: metric.changeType === 'positive' ? 'up' : metric.changeType === 'negative' ? 'down' : 'neutral',
            icon: metric.icon,
            color: `${metric.color || 'purple'}-400`
          }))}
        />
      </motion.div>

      {/* Charts and Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        {charts.length > 0 && (
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {charts.map((chart, index) => (
              <GlassCard key={index} className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{chart.title}</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-gray-400">
                    Chart placeholder for {chart.type} chart
                  </div>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        )}

        {/* Recent Items */}
        {recentItems && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{recentItems.title}</h3>
                {recentItems.onViewAll && (
                  <button
                    onClick={recentItems.onViewAll}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {recentItems.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-gray-400 text-sm">{item.subtitle}</p>
                      )}
                      {item.status && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {item.amount && (
                        <p className="text-white font-semibold">{item.amount}</p>
                      )}
                      {item.date && (
                        <p className="text-gray-400 text-xs">{item.date}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};


