import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Wrench, Users, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

const FieldServiceDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/field-service/dashboard');setData(r.data.data)})()},[])
  const d=data||{}
  const metrics=[{title:'Active Services', value:d.active_services||0, change:'+3', changeType:'positive' as const, icon:Wrench, color:'blue' as const},{title:'Technicians Available', value:d.technicians_available||0, change:'+1', changeType:'positive' as const, icon:Users, color:'green' as const},{title:'Completed Today', value:d.completed_today||0, change:'+2', changeType:'positive' as const, icon:TrendingUp, color:'purple' as const},{title:'Pending Services', value:d.pending_services||0, change:'-1', changeType:'positive' as const, icon:Wrench, color:'orange' as const}]
  return <ModuleDashboard title="Field Service" subtitle="Dispatch and service performance" icon={Wrench} metrics={metrics} charts={[{title:'Service Categories', data:(d.service_categories||[]).map((c:any)=>({label:c.category, value:c.count})), type:'bar'}]} actions={[{label:'Create Job', onClick:()=>{}},{label:'Dispatch', onClick:()=>{}, variant:'secondary'}]} />
}
export default FieldServiceDashboard





