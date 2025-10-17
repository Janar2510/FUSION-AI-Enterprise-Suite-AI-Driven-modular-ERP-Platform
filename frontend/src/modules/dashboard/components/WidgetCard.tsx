import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, 
  Settings, 
  Trash2, 
  Copy, 
  Maximize2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';

interface WidgetCardProps {
  widget: {
    id: number;
    title: string;
    description?: string;
    widget_type: string;
    config: Record<string, any>;
    data_source?: string;
    refresh_interval: number;
    theme: string;
    color_scheme: string;
    is_active: boolean;
    is_public: boolean;
    created_at: string;
    updated_at?: string;
  };
  data?: any;
  loading?: boolean;
  error?: string;
  onEdit?: (widget: any) => void;
  onDelete?: (widgetId: number) => void;
  onDuplicate?: (widget: any) => void;
  onRefresh?: (widgetId: number) => void;
  onMaximize?: (widget: any) => void;
  className?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  data,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onDuplicate,
  onRefresh,
  onMaximize,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Auto-refresh based on widget refresh interval
  useEffect(() => {
    if (widget.refresh_interval > 0) {
      const interval = setInterval(() => {
        if (onRefresh) {
          onRefresh(widget.id);
          setLastRefresh(new Date());
        }
      }, widget.refresh_interval * 1000);

      return () => clearInterval(interval);
    }
  }, [widget.refresh_interval, widget.id, onRefresh]);

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        onEdit?.(widget);
        break;
      case 'duplicate':
        onDuplicate?.(widget);
        break;
      case 'delete':
        onDelete?.(widget.id);
        break;
      case 'maximize':
        onMaximize?.(widget);
        break;
      case 'refresh':
        onRefresh?.(widget.id);
        setLastRefresh(new Date());
        break;
    }
  };

  const getWidgetIcon = () => {
    switch (widget.widget_type) {
      case 'kpi':
        return <TrendingUp className="w-5 h-5" />;
      case 'chart':
        return <TrendingDown className="w-5 h-5" />;
      case 'table':
        return <Minus className="w-5 h-5" />;
      case 'ai_insight':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (loading) return 'text-yellow-400';
    if (!widget.is_active) return 'text-gray-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (loading) return 'Loading';
    if (!widget.is_active) return 'Inactive';
    return 'Active';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative group ${className}`}
    >
      <GlassCard className="h-full p-4 hover:border-glass-active transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`${getStatusColor()}`}>
              {getWidgetIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white truncate">
                {widget.title}
              </h3>
              {widget.description && (
                <p className="text-sm text-gray-400 truncate">
                  {widget.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
              <span className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            {/* Actions menu */}
            <div className="relative">
              <GradientButton
                variant="ghost"
                size="sm"
                onClick={handleMenuToggle}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </GradientButton>
              
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-8 bg-glass-bg backdrop-blur-md border border-glass-border rounded-lg shadow-lg z-10 min-w-[160px]"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleMenuAction('edit')}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleMenuAction('duplicate')}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplicate</span>
                    </button>
                    
                    <button
                      onClick={() => handleMenuAction('maximize')}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Maximize</span>
                    </button>
                    
                    <button
                      onClick={() => handleMenuAction('refresh')}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    
                    <div className="border-t border-glass-border my-1" />
                    
                    <button
                      onClick={() => handleMenuAction('delete')}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400">Failed to load data</p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div className="h-32">
              {/* Widget content will be rendered here by parent components */}
              <div className="text-gray-400 text-sm">
                Widget content placeholder
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-glass-border">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Refresh: {widget.refresh_interval}s</span>
            {lastRefresh && (
              <span>• Last: {lastRefresh.toLocaleTimeString()}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {widget.is_public && (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                Public
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${
              widget.color_scheme === 'purple' ? 'bg-purple-500/20 text-purple-400' :
              widget.color_scheme === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              widget.color_scheme === 'green' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {widget.widget_type}
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default WidgetCard;
