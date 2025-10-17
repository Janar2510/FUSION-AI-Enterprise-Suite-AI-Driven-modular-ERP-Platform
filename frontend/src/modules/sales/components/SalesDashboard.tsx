import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Target,
  Users,
  Award,
  Calendar,
  Star,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ModuleDashboard } from '@/components/shared/ModuleDashboard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { useSalesStore } from '../stores/salesStore';

const SalesDashboard: React.FC = () => {
  const {
    dashboardMetrics,
    analytics,
    quotes,
    orders,
    loading,
    error,
    fetchDashboardMetrics,
    fetchAnalytics,
    fetchQuotes,
    fetchOrders
  } = useSalesStore();

  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchAnalytics(selectedPeriod);
    fetchQuotes({ limit: 10 });
    fetchOrders({ limit: 10 });
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
      title: 'Total Sales',
      value: `$${dashboardMetrics?.sales_statistics?.total_sales || 0}`,
      change: '+18.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'green' as const,
    },
    {
      title: 'Orders Today',
      value: dashboardMetrics?.sales_statistics?.orders_today || 0,
      change: '+12',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'blue' as const,
    },
    {
      title: 'Conversion Rate',
      value: `${dashboardMetrics?.sales_statistics?.conversion_rate || 0}%`,
      change: '+2.3%',
      changeType: 'positive' as const,
      icon: Target,
      color: 'purple' as const,
    },
    {
      title: 'Average Order Value',
      value: `$${dashboardMetrics?.sales_statistics?.average_order_value || 0}`,
      change: '+5.7%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'orange' as const,
    },
  ];

  const charts = [
    {
      title: 'Sales by Product',
      data: (dashboardMetrics?.sales_statistics?.top_products || []).map((product: any, index: number) => ({
        label: product.name || `Product ${index + 1}`,
        value: product.sales || 0,
        color: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][index % 5],
      })),
      type: 'bar' as const,
    },
    {
      title: 'Sales Performance',
      data: [
        { label: 'This Month', value: 75000, color: '#8B5CF6' },
        { label: 'Last Month', value: 65000, color: '#06B6D4' },
        { label: 'Target', value: 80000, color: '#10B981' },
      ],
      type: 'bar' as const,
    },
  ];

  const recentOrders = {
    title: 'Recent Orders',
    items: (dashboardMetrics?.recent_orders || []).slice(0, 5).map((order: any) => ({
      id: order.id,
      title: order.order_number || `Order #${order.id}`,
      subtitle: order.customer || 'Unknown Customer',
      amount: `$${order.amount || 0}`,
      status: order.status || 'pending',
      date: order.date || 'N/A',
    })),
    onViewAll: () => console.log('View all orders'),
  };

  const actions = [
    {
      label: 'Create Quote',
      onClick: () => console.log('Create quote'),
      variant: 'primary' as const,
    },
    {
      label: 'New Order',
      onClick: () => console.log('New order'),
      variant: 'secondary' as const,
    },
    {
      label: 'Sales Report',
      onClick: () => console.log('Sales report'),
      variant: 'outline' as const,
    },
  ];

  return (
    <ModuleDashboard
      title="Sales Management"
      subtitle="Track sales performance and revenue growth"
      icon={BarChart3}
      metrics={metrics}
      charts={charts}
      recentItems={recentOrders}
      actions={actions}
    />
  );
};

export default SalesDashboard;