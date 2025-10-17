import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Mail, Users, TrendingUp, Target, Eye, BarChart3 } from 'lucide-react'
import api from '@/lib/api'

const MarketingDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/v1/marketing/dashboard')
        setData(res.data.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div></div>
  }

  const d = data || {}

  const metrics = [
    { title: 'Total Campaigns', value: d.total_campaigns || 0, change: '+3', changeType: 'positive' as const, icon: Mail, color: 'blue' as const },
    { title: 'Subscribers', value: d.total_subscribers || 0, change: '+2.1%', changeType: 'positive' as const, icon: Users, color: 'green' as const },
    { title: 'Open Rate', value: `${d.open_rate || 0}%`, change: '+1.2%', changeType: 'positive' as const, icon: Eye, color: 'purple' as const },
    { title: 'Click Rate', value: `${d.click_rate || 0}%`, change: '+0.8%', changeType: 'positive' as const, icon: Target, color: 'orange' as const },
    { title: 'Revenue Generated', value: `$${d.revenue_generated || 0}`, change: '+15.3%', changeType: 'positive' as const, icon: TrendingUp, color: 'pink' as const },
  ]

  const recent = {
    title: 'Recent Campaigns',
    items: (d.recent_campaigns || []).slice(0, 5).map((campaign: any, i: number) => ({
      id: i,
      title: campaign.name,
      subtitle: `${campaign.subscribers} subscribers`,
      amount: `${campaign.open_rate}% open`,
      status: campaign.status,
      date: campaign.sent_at
    }))
  }

  const charts = [
    {
      title: 'Campaign Performance',
      data: (d.campaign_performance || []).map((campaign: any) => ({
        label: campaign.name,
        value: campaign.open_rate
      })),
      type: 'bar' as const
    }
  ]

  const actions = [
    { label: 'Create Campaign', onClick: () => {} },
    { label: 'Import Contacts', onClick: () => {}, variant: 'secondary' as const }
  ]

  return (
    <ModuleDashboard
      title="Email Marketing"
      subtitle="Campaigns and subscriber management"
      icon={Mail}
      metrics={metrics}
      charts={charts}
      recentItems={recent}
      actions={actions}
    />
  )
}

export default MarketingDashboard


