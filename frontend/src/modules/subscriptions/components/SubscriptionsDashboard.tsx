import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { CreditCard, BarChart3, TrendingUp, Users, BadgeDollarSign } from 'lucide-react'
import api from '@/lib/api'

const SubscriptionsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/v1/subscriptions/dashboard')
        setMetrics(res.data.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  const m = metrics?.subscription_statistics || {}

  const metricCards = [
    { title: 'Total Subscriptions', value: m.total_subscriptions || 0, change: '+12', changeType: 'positive' as const, icon: Users, color: 'blue' as const },
    { title: 'Active', value: m.active_subscriptions || 0, change: '+6', changeType: 'positive' as const, icon: BadgeDollarSign, color: 'green' as const },
    { title: 'Monthly Revenue', value: `$${m.monthly_revenue || 0}`, change: '+8.4%', changeType: 'positive' as const, icon: TrendingUp, color: 'purple' as const },
    { title: 'Churn Rate', value: `${m.churn_rate || 0}%`, change: '-0.3%', changeType: 'positive' as const, icon: BarChart3, color: 'orange' as const },
    { title: 'New Subscriptions', value: m.new_subscriptions || 0, change: '+3', changeType: 'positive' as const, icon: CreditCard, color: 'pink' as const },
  ]

  const recent = {
    title: 'Recent Subscriptions',
    items: (metrics?.recent_subscriptions || []).slice(0, 5).map((s: any) => ({
      id: s.id,
      title: s.customer_name,
      subtitle: s.plan_name,
      amount: `$${s.amount}`,
      status: s.status,
      date: s.created_at,
    })),
  }

  return (
    <ModuleDashboard
      title="Subscriptions"
      subtitle="Plans, customers and recurring revenue"
      icon={CreditCard}
      metrics={metricCards}
      charts={[{ title: 'Top Plans', data: (metrics?.top_plans || []).map((p: any) => ({ label: p.name, value: p.subscribers, color: '#8B5CF6' })), type: 'bar' }]}
      recentItems={recent}
      actions={[{ label: 'Create Plan', onClick: () => {} }, { label: 'New Subscription', onClick: () => {}, variant: 'secondary' }]}
    />
  )
}

export default SubscriptionsDashboard


