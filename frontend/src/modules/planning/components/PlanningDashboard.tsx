import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { CalendarRange, BarChart3 } from 'lucide-react'
import api from '@/lib/api'

const PlanningDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/planning/dashboard');setData(r.data.data)})()},[])
  const d=data||{project_status:[]}
  const metrics=[{title:'Active Projects', value:d.active_projects||0, change:'+1', changeType:'positive' as const, icon:CalendarRange, color:'blue' as const},{title:'Resources Allocated', value:d.resources_allocated||0, change:'+5', changeType:'positive' as const, icon:BarChart3, color:'purple' as const},{title:'Milestones', value:d.upcoming_milestones||0, change:'+2', changeType:'positive' as const, icon:BarChart3, color:'orange' as const},{title:'Utilization', value:`${d.resource_utilization||0}%`, change:'+0.6%', changeType:'positive' as const, icon:BarChart3, color:'green' as const}]
  return <ModuleDashboard title="Planning" subtitle="Resource planning and milestones" icon={CalendarRange} metrics={metrics} charts={[{title:'Project Status', data:(d.project_status||[]).map((s:any)=>({label:s.status, value:s.count})), type:'donut'}]} actions={[{label:'New Plan', onClick:()=>{}},{label:'Allocate Resource', onClick:()=>{}, variant:'secondary'}]} />
}
export default PlanningDashboard





