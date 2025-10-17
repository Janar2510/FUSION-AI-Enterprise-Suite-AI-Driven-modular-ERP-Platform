import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Search, DollarSign, Calendar, User, AlertCircle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useCRMStore } from '@/stores/crmStore';

interface Deal {
  id: number;
  name: string;
  amount: number;
  probability: number;
  expected_close_date: string;
  contact?: {
    full_name: string;
    email: string;
  };
  company?: {
    name: string;
  };
  stage_id: number;
  status: string;
  last_activity: string;
  tags: string[];
}

interface Stage {
  id: number;
  name: string;
  probability: number;
  color: string;
  order: number;
}

export const DealPipeline: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  
  const { fetchPipeline, moveDeal } = useCRMStore();

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      // Mock data for now
      const mockStages: Stage[] = [
        { id: 1, name: 'Lead', probability: 10, color: '#6B46C1', order: 1 },
        { id: 2, name: 'Qualified', probability: 25, color: '#3B82F6', order: 2 },
        { id: 3, name: 'Proposal', probability: 50, color: '#F59E0B', order: 3 },
        { id: 4, name: 'Negotiation', probability: 75, color: '#EF4444', order: 4 },
        { id: 5, name: 'Closed Won', probability: 100, color: '#10B981', order: 5 },
      ];

      const mockDeals: Deal[] = [
        {
          id: 1,
          name: 'Enterprise Software License',
          amount: 150000,
          probability: 25,
          expected_close_date: '2024-02-15',
          contact: { full_name: 'John Smith', email: 'john@acme.com' },
          company: { name: 'Acme Corp' },
          stage_id: 2,
          status: 'open',
          last_activity: '2024-01-15',
          tags: ['enterprise', 'software']
        },
        {
          id: 2,
          name: 'Marketing Automation Platform',
          amount: 75000,
          probability: 50,
          expected_close_date: '2024-01-30',
          contact: { full_name: 'Sarah Johnson', email: 'sarah@techstart.com' },
          company: { name: 'TechStart Inc' },
          stage_id: 3,
          status: 'open',
          last_activity: '2024-01-14',
          tags: ['marketing', 'automation']
        },
        {
          id: 3,
          name: 'CRM Implementation',
          amount: 45000,
          probability: 75,
          expected_close_date: '2024-01-25',
          contact: { full_name: 'Mike Wilson', email: 'mike@growthco.com' },
          company: { name: 'Growth Co' },
          stage_id: 4,
          status: 'open',
          last_activity: '2024-01-16',
          tags: ['crm', 'implementation']
        }
      ];

      setStages(mockStages);
      setDeals(mockDeals);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      // Move to different stage
      const dealId = parseInt(draggableId);
      const newStageId = parseInt(destination.droppableId);
      
      // Update local state immediately
      setDeals(prevDeals => 
        prevDeals.map(deal => 
          deal.id === dealId 
            ? { ...deal, stage_id: newStageId }
            : deal
        )
      );

      // Call API
      try {
        await moveDeal(dealId, newStageId);
      } catch (error) {
        console.error('Failed to move deal:', error);
        // Revert on error
        loadPipelineData();
      }
    }
  };

  const getStageColor = (probability: number) => {
    if (probability >= 80) return 'from-green-500/20 to-green-600/20';
    if (probability >= 60) return 'from-blue-500/20 to-blue-600/20';
    if (probability >= 40) return 'from-yellow-500/20 to-yellow-600/20';
    if (probability >= 20) return 'from-orange-500/20 to-orange-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  const getDaysToClose = (closeDate: string) => {
    const today = new Date();
    const close = new Date(closeDate);
    const diffTime = close.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (days: number) => {
    if (days <= 7) return 'text-red-400';
    if (days <= 14) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTotalValue = (stageId: number) => {
    return deals
      .filter(deal => deal.stage_id === stageId)
      .reduce((sum, deal) => sum + deal.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sales Pipeline</h2>
          <p className="text-white/60">Drag and drop to move deals between stages</p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => setShowCreateDeal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
            
            return (
              <div key={stage.id} className="min-w-[320px] flex flex-col">
                {/* Stage Header */}
                <GlassCard className={`mb-4 bg-gradient-to-r ${getStageColor(stage.probability)}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white text-lg">{stage.name}</h3>
                      <span className="text-white/60 text-sm">{stage.probability}%</span>
                    </div>
                    
                    {/* Stage Metrics */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/80">
                        {stageDeals.length} deals
                      </span>
                      <span className="text-white font-bold">
                        ${getTotalValue(stage.id).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* Deals in Stage */}
                <Droppable droppableId={stage.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        flex-1 space-y-3 p-2 rounded-lg transition-all min-h-[400px]
                        ${snapshot.isDraggingOver ? 'bg-white/10' : ''}
                      `}
                    >
                      <AnimatePresence>
                        {stageDeals.map((deal, index) => (
                          <Draggable
                            key={deal.id}
                            draggableId={deal.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ 
                                    opacity: snapshot.isDragging ? 0.5 : 1, 
                                    scale: snapshot.isDragging ? 1.05 : 1 
                                  }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => setSelectedDeal(deal)}
                                  className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 cursor-pointer transition-all hover:bg-white/15 shadow-lg"
                                >
                                  {/* Deal Name */}
                                  <h4 className="font-medium text-white mb-2 line-clamp-2">
                                    {deal.name}
                                  </h4>

                                  {/* Contact & Company */}
                                  <div className="flex items-center gap-2 mb-3 text-sm">
                                    {deal.contact && (
                                      <div className="flex items-center gap-1 text-white/70">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">{deal.contact.full_name}</span>
                                      </div>
                                    )}
                                    {deal.company && (
                                      <div className="flex items-center gap-1 text-white/70">
                                        <span className="text-xs">• {deal.company.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Deal Value & Probability */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4 text-green-400" />
                                      <span className="font-bold text-white">
                                        ${deal.amount.toLocaleString()}
                                      </span>
                                    </div>
                                    <span className="text-xs text-white/60">
                                      {deal.probability}% probability
                                    </span>
                                  </div>

                                  {/* Expected Close Date */}
                                  {deal.expected_close_date && (
                                    <div className="flex items-center justify-between text-sm mb-3">
                                      <div className="flex items-center gap-1 text-white/70">
                                        <Calendar className="w-3 h-3" />
                                        <span>Close in {getDaysToClose(deal.expected_close_date)} days</span>
                                      </div>
                                      {getDaysToClose(deal.expected_close_date) <= 7 && (
                                        <AlertCircle className={`w-4 h-4 ${getPriorityColor(getDaysToClose(deal.expected_close_date))}`} />
                                      )}
                                    </div>
                                  )}

                                  {/* Tags */}
                                  {deal.tags && deal.tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {deal.tags.slice(0, 3).map((tag, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 bg-primary-purple/20 text-primary-purple text-xs rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Pipeline Summary */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-white/60 text-sm">Total Pipeline</p>
            <p className="text-2xl font-bold text-white">
              ${deals.reduce((sum, deal) => sum + deal.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Weighted Pipeline</p>
            <p className="text-2xl font-bold text-white">
              ${deals.reduce((sum, deal) => sum + (deal.amount * deal.probability / 100), 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Deals in Pipeline</p>
            <p className="text-2xl font-bold text-white">{deals.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm">Avg Deal Size</p>
            <p className="text-2xl font-bold text-white">
              ${deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + deal.amount, 0) / deals.length).toLocaleString() : '0'}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};


