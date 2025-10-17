import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Warehouse,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Truck,
  CheckCircle
} from 'lucide-react';
import { ModuleDashboard } from '@/components/shared/ModuleDashboard';
import { useInventoryStore } from '../stores/inventoryStore';

const InventoryDashboard: React.FC = () => {
  const {
    dashboardMetrics,
    products,
    stockLevelReport,
    warehouses,
    loading,
    error,
    fetchDashboardMetrics,
    fetchProducts,
    fetchStockLevelReport,
    fetchWarehouses
  } = useInventoryStore();

  useEffect(() => {
    fetchDashboardMetrics();
    fetchProducts({ limit: 10 });
    fetchStockLevelReport();
    fetchWarehouses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Products',
      value: dashboardMetrics?.inventory_statistics?.total_products || 0,
      change: '+12',
      changeType: 'positive' as const,
      icon: Package,
      color: 'blue' as const,
    },
    {
      title: 'Low Stock Items',
      value: dashboardMetrics?.inventory_statistics?.low_stock_items || 0,
      change: '-3',
      changeType: 'positive' as const,
      icon: AlertTriangle,
      color: 'orange' as const,
    },
    {
      title: 'Out of Stock',
      value: dashboardMetrics?.inventory_statistics?.out_of_stock_items || 0,
      change: '-1',
      changeType: 'positive' as const,
      icon: TrendingDown,
      color: 'red' as const,
    },
    {
      title: 'Total Value',
      value: `$${dashboardMetrics?.inventory_statistics?.total_stock_value || 0}`,
      change: '+8.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'green' as const,
    },
  ];

  const charts = [
    {
      title: 'Stock Levels by Category',
      data: [
        { label: 'Electronics', value: 45, color: '#8B5CF6' },
        { label: 'Accessories', value: 30, color: '#06B6D4' },
        { label: 'Office Supplies', value: 15, color: '#10B981' },
        { label: 'Other', value: 10, color: '#F59E0B' },
      ],
      type: 'pie' as const,
    },
    {
      title: 'Inventory Movement',
      data: [
        { label: 'Inbound', value: 150, color: '#10B981' },
        { label: 'Outbound', value: 120, color: '#EF4444' },
        { label: 'Returns', value: 25, color: '#F59E0B' },
        { label: 'Adjustments', value: 15, color: '#06B6D4' },
      ],
      type: 'bar' as const,
    },
  ];

  const recentProducts = {
    title: 'Top Products',
    items: (dashboardMetrics?.top_products || []).slice(0, 5).map((product: any, index: number) => ({
      id: index,
      title: product.name || 'Unknown Product',
      subtitle: `Stock: ${product.stock || 0}`,
      amount: `$${product.value || 0}`,
      status: 'in_stock',
      date: 'N/A',
    })),
    onViewAll: () => console.log('View all products'),
  };

  const actions = [
    {
      label: 'Add Product',
      onClick: () => console.log('Add product'),
      variant: 'primary' as const,
    },
    {
      label: 'Stock Adjustment',
      onClick: () => console.log('Stock adjustment'),
      variant: 'secondary' as const,
    },
    {
      label: 'Inventory Report',
      onClick: () => console.log('Inventory report'),
      variant: 'outline' as const,
    },
  ];

  return (
    <ModuleDashboard
      title="Inventory Management"
      subtitle="Track stock levels and warehouse operations"
      icon={BarChart3}
      metrics={metrics}
      charts={charts}
      recentItems={recentProducts}
      actions={actions}
    />
  );
};

export default InventoryDashboard;