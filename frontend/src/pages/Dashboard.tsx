import React from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar,
  Bell,
  Settings
} from 'lucide-react'

import { GlassCard } from '@/components/shared/GlassCard'
import { GradientButton } from '@/components/shared/GradientButton'
import { ModuleCard } from '@/components/shared/ModuleCard'
import { MetricGrid } from '@/components/shared/MetricCard'

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400',
    },
    {
      title: 'Active Users',
      value: '2,847',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Orders',
      value: '1,234',
      change: '+15.3%',
      trend: 'up',
      icon: BarChart3,
      color: 'text-purple-400',
    },
    {
      title: 'Growth Rate',
      value: '23.1%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-pink-400',
    },
  ]

  const modules = [
    {
      name: 'Accounting',
      description: 'Financial management and reporting',
      icon: DollarSign,
      status: 'active',
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'CRM',
      description: 'Customer relationship management',
      icon: Users,
      status: 'active',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Inventory',
      description: 'Stock and warehouse management',
      icon: BarChart3,
      status: 'active',
      color: 'from-purple-500 to-violet-500',
    },
    {
      name: 'HR',
      description: 'Human resources management',
      icon: Activity,
      status: 'inactive',
      color: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Project',
      description: 'Project management and tracking',
      icon: Calendar,
      status: 'active',
      color: 'from-orange-500 to-amber-500',
    },
    {
      name: 'Marketing',
      description: 'Campaign and lead management',
      icon: TrendingUp,
      status: 'inactive',
      color: 'from-indigo-500 to-blue-500',
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'invoice',
      message: 'New invoice #INV-001 created',
      time: '2 minutes ago',
      user: 'John Doe',
    },
    {
      id: 2,
      type: 'customer',
      message: 'Customer ABC Corp updated',
      time: '15 minutes ago',
      user: 'Jane Smith',
    },
    {
      id: 3,
      type: 'order',
      message: 'Order #ORD-456 completed',
      time: '1 hour ago',
      user: 'Mike Johnson',
    },
    {
      id: 4,
      type: 'payment',
      message: 'Payment received for invoice #INV-002',
      time: '2 hours ago',
      user: 'Sarah Wilson',
    },
  ]

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="heading-1 mb-2">Dashboard</h1>
          <p className="text-white/70">Welcome back! Here's what's happening with your business.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <GradientButton variant="ghost" size="sm">
            <Bell className="w-5 h-5" />
          </GradientButton>
          <GradientButton variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </GradientButton>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <MetricGrid
        metrics={stats.map(stat => ({
          title: stat.title,
          value: stat.value,
          change: stat.change,
          trend: stat.trend,
          icon: stat.icon,
          color: stat.color
        }))}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3">Modules</h2>
              <GradientButton variant="ghost" size="sm">
                View All
              </GradientButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module, index) => (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <ModuleCard module={module} />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3">Recent Activity</h2>
              <GradientButton variant="ghost" size="sm">
                View All
              </GradientButton>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/50 text-xs">{activity.user}</span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/50 text-xs">{activity.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard


