import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Globe } from 'lucide-react'
import api from '@/lib/api'

const WebsiteDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/website/dashboard');setData(r.data.data)})()},[])
  const d=data||{top_pages:[]}
  const metrics=[{title:'Total Pages', value:d.total_pages||0, change:'+1', changeType:'positive' as const, icon:Globe, color:'blue' as const},{title:'Published', value:d.published_pages||0, change:'+1', changeType:'positive' as const, icon:Globe, color:'green' as const},{title:'Visits', value:d.total_visits||0, change:'+4.5%', changeType:'positive' as const, icon:Globe, color:'purple' as const},{title:'Draft Pages', value:d.draft_pages||0, change:'-1', changeType:'positive' as const, icon:Globe, color:'orange' as const}]
  const recent={title:'Top Pages', items:(d.top_pages||[]).map((p:any,i:number)=>({id:i,title:p.page, subtitle:'', amount:p.views, status:'live'}))}
  return <ModuleDashboard title="Website" subtitle="Content & pages" icon={Globe} metrics={metrics} charts={[{title:'Page Views', data:(d.top_pages||[]).map((p:any)=>({label:p.page, value:p.views})), type:'bar'}]} recentItems={recent} actions={[{label:'New Page', onClick:()=>{}}]} />
}
export default WebsiteDashboard





