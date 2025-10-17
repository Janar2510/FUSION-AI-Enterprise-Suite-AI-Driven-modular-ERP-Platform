import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Brush, Clock } from 'lucide-react'
import api from '@/lib/api'

const StudioDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/studio/dashboard');setData(r.data.data)})()},[])
  const d=data||{recent_projects:[]}
  const metrics=[{title:'Total Projects', value:d.total_projects||0, change:'+1', changeType:'positive' as const, icon:Brush, color:'blue' as const},{title:'Active', value:d.active_projects||0, change:'+1', changeType:'positive' as const, icon:Brush, color:'green' as const},{title:'Storage Used', value:d.storage_used||'0 GB', change:'+0.1 GB', changeType:'positive' as const, icon:Brush, color:'purple' as const},{title:'Avg. Project Time', value:d.avg_project_time||'2.5h', change:'-0.3h', changeType:'positive' as const, icon:Clock, color:'orange' as const}]
  const recent={title:'Recent Projects', items:(d.recent_projects||[]).map((p:any,i:number)=>({id:i,title:p.name, subtitle:p.status, date:p.created}))}
  return <ModuleDashboard title="Studio" subtitle="Creative asset management" icon={Brush} metrics={metrics} charts={[]} recentItems={recent} actions={[{label:'New Project', onClick:()=>{}}]} />
}
export default StudioDashboard



