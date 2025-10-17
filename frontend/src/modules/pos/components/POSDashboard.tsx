import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { MonitorSmartphone, DollarSign, CreditCard, ShoppingCart, Users } from 'lucide-react'
import api from '@/lib/api'

const POSDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/v1/pos/dashboard')
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
    { title: 'Sales Today', value: `$${d.total_sales_today || 0}`, change: '+5.2%', changeType: 'positive' as const, icon: DollarSign, color: 'green' as const },
    { title: 'Transactions', value: d.total_transactions_today || 0, change: '+12', changeType: 'positive' as const, icon: ShoppingCart, color: 'blue' as const },
    { title: 'Avg. Ticket', value: `$${d.average_transaction_value || 0}`, change: '+1.1%', changeType: 'positive' as const, icon: CreditCard, color: 'purple' as const },
    { title: 'Active Terminals', value: (d.terminal_performance || []).length, change: '+1', changeType: 'positive' as const, icon: MonitorSmartphone, color: 'orange' as const },
    { title: 'Active Cashiers', value: d.active_cashiers || 3, change: '+2', changeType: 'positive' as const, icon: Users, color: 'pink' as const },
  ]

  const recent = {
    title: 'Top Selling Products',
    items: (d.top_selling_products || []).slice(0, 5).map((p: any, i: number) => ({ id: i, title: p.product_name, subtitle: `${p.quantity_sold} sold`, amount: `$${p.revenue}`, status: 'live' })),
  }

  return (
    <ModuleDashboard
      title="Point of Sale"
      subtitle="Terminals, sales and payments"
      icon={MonitorSmartphone}
      metrics={metrics}
      charts={[{ title: 'Payments Breakdown', data: (d.payment_methods_breakdown || []).map((m: any)=>({ label: m.method, value: m.amount })), type: 'pie' }]}
      recentItems={recent}
      actions={[{ label: 'Open Register', onClick: () => {} }, { label: 'New Sale', onClick: () => {}, variant: 'secondary' }]}
    />
  )
}

export default POSDashboard



