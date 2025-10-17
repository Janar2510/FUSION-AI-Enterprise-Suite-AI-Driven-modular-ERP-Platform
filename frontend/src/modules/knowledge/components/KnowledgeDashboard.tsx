import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { BookOpen } from 'lucide-react'
import api from '@/lib/api'

const KnowledgeDashboard: React.FC = () => {
  const [data,setData]=useState<any>(null)
  useEffect(()=>{(async()=>{const r=await api.get('/api/v1/knowledge/dashboard');setData(r.data.data)})()},[])
  const d=data||{categories:[]}
  const metrics=[{title:'Total Articles', value:d.total_articles||0, change:'+10', changeType:'positive' as const, icon:BookOpen, color:'blue' as const},{title:'Articles This Month', value:d.articles_this_month||0, change:'+2', changeType:'positive' as const, icon:BookOpen, color:'purple' as const},{title:'Search Queries', value:d.search_queries||0, change:'+5%', changeType:'positive' as const, icon:BookOpen, color:'orange' as const},{title:'Most Viewed', value:d.most_viewed||'—', change:'', changeType:'neutral' as const, icon:BookOpen, color:'pink' as const}]
  return <ModuleDashboard title="Knowledge" subtitle="Knowledge base and docs" icon={BookOpen} metrics={metrics} charts={[{title:'Categories', data:(d.categories||[]).map((c:any)=>({label:c.category, value:c.articles})), type:'bar'}]} actions={[{label:'New Article', onClick:()=>{}}]} />
}
export default KnowledgeDashboard





