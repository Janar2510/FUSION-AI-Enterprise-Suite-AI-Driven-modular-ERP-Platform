import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Key, Truck, DollarSign, Clock } from 'lucide-react'
import api from '@/lib/api'

const RentalDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/v1/rental/dashboard')
        setData(res.data.data)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"/></div>

  const d = data || {}
  const metrics = [
    { title: 'Active Rentals', value: d.total_active_rentals || 0, change: '+3', changeType: 'positive' as const, icon: Key, color: 'blue' as const },
    { title: 'Revenue (month)', value: `$${d.total_revenue_this_month || 0}`, change: '+6.8%', changeType: 'positive' as const, icon: DollarSign, color: 'green' as const },
    { title: 'Overdue', value: d.overdue_rentals || 0, change: '-1', changeType: 'positive' as const, icon: Truck, color: 'orange' as const },
    { title: 'Available Equipment', value: d.available_equipment || 0, change: '+2', changeType: 'positive' as const, icon: Truck, color: 'purple' as const },
    { title: 'Avg Rental Duration', value: `${d.avg_rental_duration || 7} days`, change: '+0.5', changeType: 'positive' as const, icon: Clock, color: 'pink' as const },
  ]

  const recent = { title: 'Recent Rentals', items: (d.recent_rentals || []).map((r:any)=>({ id:r.rental_id, title:r.customer_name, subtitle:r.equipment_name, amount:`$${r.total_amount}`, status:r.status, date:r.start_date })) }

  return (
    <ModuleDashboard title="Rental" subtitle="Equipment & property rental" icon={Truck} metrics={metrics} charts={[{ title:'Categories', data:(d.rental_categories||[]).map((c:any)=>({label:c.category, value:c.revenue})), type:'bar' }]} recentItems={recent} actions={[{label:'New Rental', onClick:()=>{}},{label:'Return Item', onClick:()=>{}, variant:'secondary'}]} />
  )
}

export default RentalDashboard



