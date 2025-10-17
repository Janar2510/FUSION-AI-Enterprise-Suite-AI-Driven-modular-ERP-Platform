import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { ModuleDashboard } from '@/components/shared/ModuleDashboard';
import { ProjectStatus, TaskStatus, ProjectType } from '../types';

const ProjectDashboard: React.FC = () => {
  const {
    dashboardMetrics,
    analytics,
    projects,
    tasks,
    loading,
    error,
    fetchDashboardMetrics,
    fetchAnalytics,
    fetchProjects,
    fetchTasks
  } = useProjectStore();

  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchAnalytics(selectedPeriod);
    fetchProjects({ limit: 10 });
    fetchTasks({ limit: 10 });
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
      title: 'Total Projects',
      value: dashboardMetrics?.total_projects || 0,
      change: '+3 this month',
      changeType: 'positive' as const,
      icon: FolderOpen,
      color: 'blue' as const,
    },
    {
      title: 'Active Projects',
      value: dashboardMetrics?.active_projects || 0,
      change: '+2 this week',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'green' as const,
    },
    {
      title: 'Completed Projects',
      value: dashboardMetrics?.completed_projects || 0,
      change: '+1 this month',
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'purple' as const,
    },
    {
      title: 'Team Members',
      value: dashboardMetrics?.team_members || 0,
      change: '+2 new members',
      changeType: 'positive' as const,
      icon: Users,
      color: 'orange' as const,
    },
  ];

  const charts = [
    {
      title: 'Project Analytics',
      data: [
        { label: 'Active', value: dashboardMetrics?.active_projects || 0, color: '#10B981' },
        { label: 'Completed', value: dashboardMetrics?.completed_projects || 0, color: '#8B5CF6' },
        { label: 'On Hold', value: 2, color: '#F59E0B' },
      ],
      type: 'bar' as const,
    },
  ];

  const recentProjects = {
    title: 'Recent Projects',
    items: (projects || []).slice(0, 5).map((project: any) => ({
      id: project.id,
      title: project.name || 'Unknown Project',
      subtitle: `Deadline: ${project.deadline || 'N/A'}`,
      amount: `${project.progress || 0}% complete`,
      status: project.status || 'active',
      date: `${project.team_size || 0} members`,
    })),
    onViewAll: () => console.log('View all projects'),
  };

  const actions = [
    {
      label: 'Create Project',
      onClick: () => console.log('Create project'),
      variant: 'primary' as const,
    },
    {
      label: 'Create Task',
      onClick: () => console.log('Create task'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <ModuleDashboard
      title="Project Management"
      subtitle="Track and manage your projects"
      icon={FolderOpen}
      metrics={metrics}
      charts={charts}
      recentItems={recentProjects}
      actions={actions}
    />
  );
};

export default ProjectDashboard;