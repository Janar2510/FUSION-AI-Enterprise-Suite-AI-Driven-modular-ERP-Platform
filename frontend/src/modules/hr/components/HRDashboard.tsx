import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ModuleDashboard } from '@/components/shared/ModuleDashboard';
import { useHRStore } from '../stores/hrStore';

const HRDashboard: React.FC = () => {
  const { 
    dashboardMetrics, 
    employees,
    attendance,
    loading, 
    error, 
    fetchDashboardMetrics,
    fetchEmployees,
    fetchAttendance
  } = useHRStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardMetrics(selectedPeriod);
    fetchEmployees();
    fetchAttendance();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Employees',
      value: dashboardMetrics?.hr_statistics?.total_employees || 0,
      change: '+5 new hires',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue' as const,
    },
    {
      title: 'New Hires',
      value: dashboardMetrics?.hr_statistics?.new_hires_this_month || 0,
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: UserPlus,
      color: 'green' as const,
    },
    {
      title: 'Departments',
      value: dashboardMetrics?.hr_statistics?.departments || 0,
      change: '+1 new',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'orange' as const,
    },
    {
      title: 'Turnover Rate',
      value: `${dashboardMetrics?.hr_statistics?.turnover_rate || 0}%`,
      change: '-0.5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'purple' as const,
    },
  ];

  const charts = [
    {
      title: 'Employee Distribution',
      data: [
        { label: 'Engineering', value: 45, color: '#8B5CF6' },
        { label: 'Sales', value: 25, color: '#06B6D4' },
        { label: 'Marketing', value: 15, color: '#10B981' },
        { label: 'HR', value: 10, color: '#F59E0B' },
        { label: 'Other', value: 5, color: '#EF4444' },
      ],
      type: 'pie' as const,
    },
    {
      title: 'Attendance Trends',
      data: [
        { label: 'This Week', value: 95, color: '#10B981' },
        { label: 'Last Week', value: 92, color: '#06B6D4' },
        { label: 'Target', value: 90, color: '#8B5CF6' },
      ],
      type: 'bar' as const,
    },
  ];

  const recentEmployees = {
    title: 'Recent Hires',
    items: (dashboardMetrics?.recent_hires || []).slice(0, 5).map((employee: any, index: number) => ({
      id: index,
      title: employee.name || 'Unknown Employee',
      subtitle: employee.department || 'No Department',
      amount: employee.position || 'N/A',
      status: 'active',
      date: employee.start_date || 'N/A',
    })),
    onViewAll: () => console.log('View all employees'),
  };

  const actions = [
    {
      label: 'Add Employee',
      onClick: () => console.log('Add employee'),
      variant: 'primary' as const,
    },
    {
      label: 'Attendance Report',
      onClick: () => console.log('Attendance report'),
      variant: 'secondary' as const,
    },
    {
      label: 'Payroll',
      onClick: () => console.log('Payroll'),
      variant: 'outline' as const,
    },
  ];

  return (
    <ModuleDashboard
      title="Human Resources"
      subtitle="Manage employees and workforce"
      icon={BarChart3}
      metrics={metrics}
      charts={charts}
      recentItems={recentEmployees}
      actions={actions}
    />
  );
};

export default HRDashboard;