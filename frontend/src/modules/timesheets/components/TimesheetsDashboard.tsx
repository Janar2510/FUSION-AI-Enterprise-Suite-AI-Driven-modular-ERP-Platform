import React, { useEffect, useState } from 'react'
import { ModuleDashboard } from '@/components/shared/ModuleDashboard'
import { Timer, Users, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

const TimesheetsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.get('/api/v1/timesheets/dashboard');setData(r.data.data);}finally{setLoading(false)}})()},[])
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"/></div>
  const d=data||{}
  const metrics=[{title:'Hours This Week', value:d.total_hours_this_week||0, change:'+4.2%', changeType:'positive' as const, icon:Timer, color:'purple' as const},{title:'Employees Clocked In', value:d.employees_clocked_in||0, change:'+2', changeType:'positive' as const, icon:Users, color:'blue' as const},{title:'Utilization', value:`${d.utilization_rate||0}%`, change:'+1.2%', changeType:'positive' as const, icon:TrendingUp, color:'green' as const},{title:'Overtime Hours', value:d.overtime_hours||0, change:'+0.7h', changeType:'positive' as const, icon:Timer, color:'orange' as const}]
  const recent={title:'Recent Entries', items:(d.recent_entries||[]).map((e:any,i:number)=>({id:i,title:e.employee_name, subtitle:`${e.date} • ${e.project}`, amount:`${e.hours_worked}h`, status:e.status}))}
  return <ModuleDashboard title="Timesheets" subtitle="Time tracking and approvals" icon={Timer} metrics={metrics} charts={[{title:'Department Summary', data:(d.department_summary||[]).map((x:any)=>({label:x.department, value:x.total_hours})), type:'bar'}]} recentItems={recent} actions={[{label:'Add Entry', onClick:()=>{}},{label:'Approve', onClick:()=>{}, variant:'secondary'}]} />
}
export default TimesheetsDashboard





