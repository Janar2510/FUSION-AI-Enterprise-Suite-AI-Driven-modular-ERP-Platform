import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  BarChart3, 
  TrendingUp, 
  Table, 
  Brain,
  Settings,
  Palette,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { api } from '../../../lib/api';

interface WidgetTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  default_config: Record<string, any>;
  default_size: { width: number; height: number };
}

interface WidgetCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetCreated: (widget: any) => void;
  position?: { x: number; y: number };
}

const WidgetCreator: React.FC<WidgetCreatorProps> = ({
  isOpen,
  onClose,
  onWidgetCreated,
  position = { x: 0, y: 0 }
}) => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    description: '',
    widget_type: '',
    position_x: 0,
    position_y: 0,
    width: 4,
    height: 3,
    config: {},
    data_source: '',
    refresh_interval: 300,
    theme: 'default',
    color_scheme: 'purple',
    is_public: false
  });
  const [templates, setTemplates] = useState<WidgetTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch widget templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/dashboard/templates');
        setTemplates(response.data.templates);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
        setError('Failed to load widget templates');
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: WidgetTemplate) => {
    setSelectedTemplate(template);
    setWidgetConfig(prev => ({
      ...prev,
      widget_type: template.type,
      width: template.default_size.width,
      height: template.default_size.height,
      config: template.default_config
    }));
    setStep(2);
  };

  const handleConfigChange = (field: string, value: any) => {
    setWidgetConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateWidget = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/dashboard/widgets', widgetConfig);
      
      onWidgetCreated(response.data);
      onClose();
      
      // Reset form
      setStep(1);
      setSelectedTemplate(null);
      setWidgetConfig({
        title: '',
        description: '',
        widget_type: '',
        position_x: 0,
        position_y: 0,
        width: 4,
        height: 3,
        config: {},
        data_source: '',
        refresh_interval: 300,
        theme: 'default',
        color_scheme: 'purple',
        is_public: false
      });
    } catch (err) {
      console.error('Failed to create widget:', err);
      setError('Failed to create widget');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'kpi':
        return <TrendingUp className="w-6 h-6" />;
      case 'chart':
        return <BarChart3 className="w-6 h-6" />;
      case 'table':
        return <Table className="w-6 h-6" />;
      case 'ai_insight':
        return <Brain className="w-6 h-6" />;
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  const getColorSchemeOptions = () => [
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
    { value: 'gray', label: 'Gray', color: 'bg-gray-500' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-glass-bg backdrop-blur-md border border-glass-border rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-border">
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Widget</h2>
              <p className="text-gray-400 mt-1">
                Step {step} of 2: {step === 1 ? 'Choose Template' : 'Configure Widget'}
              </p>
            </div>
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </GradientButton>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Widget Template</h3>
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 bg-glass-bg border border-glass-border rounded-lg cursor-pointer hover:border-glass-active transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-purple-400">
                          {getTemplateIcon(template.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                          <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>Type: {template.type}</span>
                            <span>•</span>
                            <span>Size: {template.default_size.width}×{template.default_size.height}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && selectedTemplate && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="text-purple-400">
                    {getTemplateIcon(selectedTemplate.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedTemplate.name}</h3>
                    <p className="text-gray-400">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-white">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Widget Title *
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.title}
                          onChange={(e) => handleConfigChange('title', e.target.value)}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                          placeholder="Enter widget title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.description}
                          onChange={(e) => handleConfigChange('description', e.target.value)}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Layout Settings */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-white">Layout Settings</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Width
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={widgetConfig.width}
                          onChange={(e) => handleConfigChange('width', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Height
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={widgetConfig.height}
                          onChange={(e) => handleConfigChange('height', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          X Position
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={widgetConfig.position_x}
                          onChange={(e) => handleConfigChange('position_x', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Y Position
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={widgetConfig.position_y}
                          onChange={(e) => handleConfigChange('position_y', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-white">Appearance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Color Scheme
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {getColorSchemeOptions().map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleConfigChange('color_scheme', option.value)}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                widgetConfig.color_scheme === option.value
                                  ? 'border-purple-400 bg-purple-500/20'
                                  : 'border-glass-border hover:border-glass-active'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded ${option.color} mx-auto`} />
                              <span className="text-xs text-gray-300 mt-1 block">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={widgetConfig.theme}
                          onChange={(e) => handleConfigChange('theme', e.target.value)}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                        >
                          <option value="default">Default</option>
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Data Settings */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-white">Data Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Data Source
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.data_source}
                          onChange={(e) => handleConfigChange('data_source', e.target.value)}
                          className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                          placeholder="API endpoint or query"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Refresh Interval (seconds)
                        </label>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="30"
                            value={widgetConfig.refresh_interval}
                            onChange={(e) => handleConfigChange('refresh_interval', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-white">Privacy Settings</h4>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleConfigChange('is_public', !widgetConfig.is_public)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                          widgetConfig.is_public
                            ? 'border-green-400 bg-green-500/20 text-green-400'
                            : 'border-glass-border hover:border-glass-active text-gray-400'
                        }`}
                      >
                        {widgetConfig.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span className="text-sm">
                          {widgetConfig.is_public ? 'Public Widget' : 'Private Widget'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-glass-border">
            <div>
              {step === 2 && (
                <GradientButton
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  Back
                </GradientButton>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <GradientButton
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </GradientButton>
              
              {step === 1 ? (
                <GradientButton
                  onClick={() => setStep(2)}
                  disabled={!selectedTemplate}
                >
                  Next
                </GradientButton>
              ) : (
                <GradientButton
                  onClick={handleCreateWidget}
                  disabled={!widgetConfig.title || loading}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Widget
                    </>
                  )}
                </GradientButton>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WidgetCreator;
