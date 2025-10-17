import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Mail } from 'lucide-react'
import api from '@/lib/api'

const EmailMarketingDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/email-marketing/dashboard');setData(r.data.data)})()},[])
  const d=data||{recent_campaigns:[]}
  const metrics=[{title:'Total Campaigns', value:d.total_campaigns||0, change:'+1', changeType:'positive' as const, icon:Mail, color:'blue' as const},{title:'Subscribers', value:d.subscribers||0, change:'+2%', changeType:'positive' as const, icon:Mail, color:'green' as const},{title:'Open Rate', value:`${d.open_rate||0}%`, change:'+0.4%', changeType:'positive' as const, icon:Mail, color:'purple' as const},{title:'Click Rate', value:`${d.click_rate||0}%`, change:'+0.2%', changeType:'positive' as const, icon:Mail, color:'orange' as const}]
  const recent={title:'Recent Campaigns', items:(d.recent_campaigns||[]).map((c:any,i:number)=>({id:i,title:c.name, subtitle:`Sent: ${c.sent}`, amount:`Opened: ${c.opened}`}))}
  return <ModuleDashboard title="Email Marketing" subtitle="Campaigns and automation" icon={Mail} metrics={metrics} charts={[{title:'Click/Open Rates', data:[{label:'Open', value:d.open_rate||0},{label:'Click', value:d.click_rate||0}], type:'donut'}]} recentItems={recent} actions={[{label:'New Campaign', onClick:()=>{}}]} />
}
export default EmailMarketingDashboard





