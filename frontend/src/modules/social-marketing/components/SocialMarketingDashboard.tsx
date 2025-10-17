import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Share2, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

const SocialMarketingDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/social-marketing/dashboard');setData(r.data.data)})()},[])
  const d=data||{platforms:[]}
  const metrics=[{title:'Followers', value:d.total_followers||0, change:'+2.3%', changeType:'positive' as const, icon:Share2, color:'blue' as const},{title:'Posts This Month', value:d.posts_this_month||0, change:'+4', changeType:'positive' as const, icon:Share2, color:'green' as const},{title:'Engagement', value:`${d.engagement_rate||0}%`, change:'+0.6%', changeType:'positive' as const, icon:Share2, color:'purple' as const},{title:'Reach This Week', value:d.weekly_reach||0, change:'+15%', changeType:'positive' as const, icon:TrendingUp, color:'orange' as const}]
  return <ModuleDashboard title="Social Marketing" subtitle="Social presence and engagement" icon={Share2} metrics={metrics} charts={[{title:'Platforms', data:(d.platforms||[]).map((p:any)=>({label:p.platform, value:p.followers})), type:'bar'}]} actions={[{label:'New Post', onClick:()=>{}}]} />
}
export default SocialMarketingDashboard



