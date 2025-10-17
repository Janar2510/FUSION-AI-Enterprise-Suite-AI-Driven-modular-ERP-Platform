import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Factory, Package, Clock, AlertTriangle, TrendingUp, Settings } from 'lucide-react'
import api from '@/lib/api'

const ManufacturingDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/v1/manufacturing/dashboard')
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
    { title: 'Production Lines', value: d.active_production_lines || 0, change: '+1', changeType: 'positive' as const, icon: Factory, color: 'blue' as const },
    { title: 'Units Produced', value: d.units_produced_today || 0, change: '+12%', changeType: 'positive' as const, icon: Package, color: 'green' as const },
    { title: 'Efficiency Rate', value: `${d.efficiency_rate || 0}%`, change: '+2.1%', changeType: 'positive' as const, icon: TrendingUp, color: 'purple' as const },
    { title: 'Quality Score', value: `${d.quality_score || 0}%`, change: '+0.5%', changeType: 'positive' as const, icon: Settings, color: 'orange' as const },
    { title: 'Downtime', value: `${d.downtime_hours || 0}h`, change: '-1.2h', changeType: 'positive' as const, icon: Clock, color: 'pink' as const },
  ]

  const recent = {
    title: 'Recent Production Orders',
    items: (d.recent_orders || []).slice(0, 5).map((order: any, i: number) => ({
      id: i,
      title: order.product_name,
      subtitle: `Order #${order.order_id}`,
      amount: `${order.quantity} units`,
      status: order.status,
      date: order.created_at
    }))
  }

  const charts = [
    {
      title: 'Production by Line',
      data: (d.production_by_line || []).map((line: any) => ({
        label: line.line_name,
        value: line.units_produced
      })),
      type: 'bar' as const
    }
  ]

  const actions = [
    { label: 'New Production Order', onClick: () => {} },
    { label: 'Schedule Maintenance', onClick: () => {}, variant: 'secondary' as const }
  ]

  return (
    <ModuleDashboard
      title="Manufacturing"
      subtitle="Production lines and quality control"
      icon={Factory}
      metrics={metrics}
      charts={charts}
      recentItems={recent}
      actions={actions}
    />
  )
}

export default ManufacturingDashboard


