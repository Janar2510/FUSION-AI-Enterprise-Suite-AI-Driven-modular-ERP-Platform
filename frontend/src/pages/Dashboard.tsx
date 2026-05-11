import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Package,
  ShoppingCart,
  FileText,
  Target,
  type LucideIcon
} from 'lucide-react'

import { GlassCard } from '@/components/shared/GlassCard'
import { ModuleCard } from '@/components/shared/ModuleCard'
import { MetricGrid } from '@/components/shared/MetricCard'

interface DashboardKPIs {
  contacts: number
  leads: number
  opportunities: number
  saleOrders: number
  purchaseOrders: number
  invoices: number
  employees: number
  projects: number
  tasks: number
  tickets: number
  products: number
  totalRevenue: number
}

interface TopOpportunity {
  id: number
  name: string
  expectedRevenue: number | null
  stage: { name: string } | null
  partner: { name: string } | null
}

interface DashboardData {
  kpis: DashboardKPIs
  topOpportunities: TopOpportunity[]
}

interface ActivityItem {
  id: string
  summary: string
  ownerType: string
  createdAt: string
}

const MODULES: Array<{ name: string; description: string; icon: LucideIcon; status: 'active'; color: string }> = [
  { name: 'Accounting', description: 'Financial management and reporting', icon: DollarSign, status: 'active', color: 'from-green-500 to-emerald-500' },
  { name: 'CRM', description: 'Customer relationship management', icon: Users, status: 'active', color: 'from-primary-500 to-secondary-500' },
  { name: 'Inventory', description: 'Stock and warehouse management', icon: Package, status: 'active', color: 'from-blue-500 to-cyan-500' },
  { name: 'HR', description: 'Human resources management', icon: Activity, status: 'active', color: 'from-pink-500 to-rose-500' },
  { name: 'Project', description: 'Project management and tracking', icon: Calendar, status: 'active', color: 'from-orange-500 to-amber-500' },
  { name: 'Sales', description: 'Sales orders and quotations', icon: ShoppingCart, status: 'active', color: 'from-amber-500 to-orange-500' },
]

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ownerTypeIcon(ownerType: string): string {
  const icons: Record<string, string> = { SaleOrder: '🛒', AccountMove: '🧾', CrmLead: '🎯', StockPicking: '📦', PurchaseOrder: '📋', HelpdeskTicket: '🎫' }
  return icons[ownerType] ?? '📌'
}

const Dashboard: React.FC = () => {
  const { data: dash, isLoading: kpiLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await axios.get('/api/dashboard')).data,
    refetchInterval: 60_000,
  })

  const { data: activity = [], isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['dashboard-activity'],
    queryFn: async () => (await axios.get('/api/dashboard/recent-activity')).data,
    refetchInterval: 30_000,
  })

  const kpis = dash?.kpis

  const stats = [
    { title: 'Total Revenue', value: kpis ? formatCurrency(kpis.totalRevenue) : '—', change: '', trend: 'up' as const, icon: DollarSign, color: 'text-green-400' },
    { title: 'Sale Orders', value: kpiLoading ? '…' : String(kpis?.saleOrders ?? 0), change: '', trend: 'up' as const, icon: ShoppingCart, color: 'text-primary-400' },
    { title: 'Opportunities', value: kpiLoading ? '…' : String(kpis?.opportunities ?? 0), change: '', trend: 'up' as const, icon: Target, color: 'text-secondary-400' },
    { title: 'Employees', value: kpiLoading ? '…' : String(kpis?.employees ?? 0), change: '', trend: 'neutral' as const, icon: Users, color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="heading-1 mb-2">Dashboard</h1>
          <p className="text-white/60 text-sm">Live overview · refreshes every minute</p>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-sm">
          <BarChart3 className="w-4 h-4" />
          <span>{kpis ? `${kpis.contacts} contacts · ${kpis.products} products · ${kpis.tickets} open tickets` : 'Loading…'}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <MetricGrid metrics={stats.map(s => ({ title: s.title, value: s.value, change: s.change, trend: s.trend, icon: s.icon, color: s.color }))} />

      {/* Secondary KPI row */}
      {kpis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Leads', value: kpis.leads, icon: '🎯' },
            { label: 'Invoices', value: kpis.invoices, icon: '🧾' },
            { label: 'Purchase Orders', value: kpis.purchaseOrders, icon: '📋' },
            { label: 'Projects', value: kpis.projects, icon: '📁' },
          ].map(item => (
            <GlassCard key={item.label} className="p-4 flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-white/50 text-xs">{item.label}</p>
                <p className="text-white font-semibold text-lg">{item.value}</p>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h2 className="heading-3 mb-5">Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES.map((module, index) => (
                <motion.div key={module.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}>
                  <ModuleCard module={module} />
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Top Opportunities */}
          {dash?.topOpportunities && dash.topOpportunities.length > 0 && (
            <GlassCard className="p-6">
              <h2 className="heading-3 mb-5 flex items-center gap-2"><Target className="w-5 h-5 text-primary-400" /> Top Opportunities</h2>
              <div className="space-y-2">
                {dash.topOpportunities.map(opp => (
                  <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{opp.name}</p>
                      <p className="text-white/50 text-xs">{opp.partner?.name ?? '—'} · {opp.stage?.name ?? '—'}</p>
                    </div>
                    <span className="text-primary-400 font-semibold text-sm">{opp.expectedRevenue ? formatCurrency(opp.expectedRevenue) : '—'}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <GlassCard className="p-6 h-full">
            <h2 className="heading-3 mb-5 flex items-center gap-2"><FileText className="w-5 h-5 text-secondary-400" /> Recent Activity</h2>
            <div className="space-y-3">
              {activityLoading && <p className="text-white/40 text-sm">Loading…</p>}
              {!activityLoading && activity.length === 0 && (
                <p className="text-white/40 text-sm">No recent activity yet.</p>
              )}
              {activity.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
                  <span className="text-base flex-shrink-0">{ownerTypeIcon(item.ownerType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-snug">{item.summary}</p>
                    <p className="text-white/40 text-xs mt-0.5">{timeAgo(item.createdAt)}</p>
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


