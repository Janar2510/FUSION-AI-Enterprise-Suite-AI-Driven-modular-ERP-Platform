import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Headphones, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ModuleDashboard } from '@/components/shared/ModuleDashboard';
import { useHelpdeskStore } from '../stores/helpdeskStore';

const HelpdeskDashboard: React.FC = () => {
  const {
    dashboardMetrics,
    tickets,
    responses,
    loading,
    error,
    fetchDashboardMetrics,
    fetchAnalytics,
    fetchTickets,
    fetchResponses
  } = useHelpdeskStore();

  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchAnalytics(selectedPeriod);
    fetchTickets({ limit: 10 });
    fetchResponses({ limit: 10 });
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
      title: 'Total Tickets',
      value: dashboardMetrics?.ticket_statistics?.total_tickets || 0,
      change: '+15 this week',
      changeType: 'positive' as const,
      icon: MessageSquare,
      color: 'blue' as const,
    },
    {
      title: 'Open Tickets',
      value: dashboardMetrics?.ticket_statistics?.open_tickets || 0,
      change: '-5 resolved',
      changeType: 'positive' as const,
      icon: Clock,
      color: 'orange' as const,
    },
    {
      title: 'Response Time',
      value: `${dashboardMetrics?.ticket_statistics?.avg_response_time || 0}m`,
      change: '-12m',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'green' as const,
    },
    {
      title: 'Satisfaction',
      value: `${dashboardMetrics?.ticket_statistics?.satisfaction_score || 0}%`,
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: Star,
      color: 'purple' as const,
    },
  ];

  const charts = [
    {
      title: 'Ticket Categories',
      data: [
        { label: 'Technical', value: 35, color: '#8B5CF6' },
        { label: 'Billing', value: 25, color: '#06B6D4' },
        { label: 'General', value: 20, color: '#10B981' },
        { label: 'Feature Request', value: 15, color: '#F59E0B' },
        { label: 'Bug Report', value: 5, color: '#EF4444' },
      ],
      type: 'pie' as const,
    },
    {
      title: 'Resolution Time Trends',
      data: [
        { label: 'This Week', value: 45, color: '#10B981' },
        { label: 'Last Week', value: 52, color: '#06B6D4' },
        { label: 'Target', value: 60, color: '#8B5CF6' },
      ],
      type: 'bar' as const,
    },
  ];

  const recentTickets = {
    title: 'Recent Tickets',
    items: (dashboardMetrics?.recent_tickets || []).slice(0, 5).map((ticket: any) => ({
      id: ticket.id,
      title: ticket.subject || 'No Subject',
      subtitle: ticket.category || 'General',
      amount: ticket.priority || 'medium',
      status: ticket.status || 'open',
      date: ticket.created_at || 'N/A',
    })),
    onViewAll: () => console.log('View all tickets'),
  };

  const actions = [
    {
      label: 'New Ticket',
      onClick: () => console.log('New ticket'),
      variant: 'primary' as const,
    },
    {
      label: 'Knowledge Base',
      onClick: () => console.log('Knowledge base'),
      variant: 'secondary' as const,
    },
    {
      label: 'Reports',
      onClick: () => console.log('Reports'),
      variant: 'outline' as const,
    },
  ];

  return (
    <ModuleDashboard
      title="Customer Support"
      subtitle="Manage support tickets and customer service"
      icon={BarChart3}
      metrics={metrics}
      charts={charts}
      recentItems={recentTickets}
      actions={actions}
    />
  );
};

export default HelpdeskDashboard;
