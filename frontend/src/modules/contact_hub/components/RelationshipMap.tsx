import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ZoomIn, ZoomOut, RotateCcw, User, Building } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';

export const RelationshipMap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Mock relationship data
  const relationships = [
    {
      id: '1',
      source: { id: 'c1', name: 'John Doe', type: 'person', company: 'Acme Corp' },
      target: { id: 'c2', name: 'Jane Smith', type: 'person', company: 'Acme Corp' },
      relationship: 'colleagues',
      strength: 0.8
    },
    {
      id: '2',
      source: { id: 'c1', name: 'John Doe', type: 'person', company: 'Acme Corp' },
      target: { id: 'c3', name: 'Robert Johnson', type: 'person', company: 'Tech Solutions' },
      relationship: 'business_partners',
      strength: 0.6
    },
    {
      id: '3',
      source: { id: 'c4', name: 'Acme Corp', type: 'company' },
      target: { id: 'c5', name: 'Global Enterprises', type: 'company' },
      relationship: 'suppliers',
      strength: 0.9
    },
    {
      id: '4',
      source: { id: 'c2', name: 'Jane Smith', type: 'person', company: 'Acme Corp' },
      target: { id: 'c6', name: 'Sarah Wilson', type: 'person', company: 'Innovate Inc' },
      relationship: 'friends',
      strength: 0.7
    }
  ];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search relationships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
          >
            <option value="all">All Relationships</option>
            <option value="person">Person-to-Person</option>
            <option value="company">Company-to-Company</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleZoomIn}
              className="p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Relationship Map Visualization */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Relationship Map</h2>
        
        <div className="relative h-[500px] bg-dark-bg/50 rounded-lg border border-white/10 overflow-hidden">
          {/* Visualization Area */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Central Node */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white font-bold">
                You
              </div>
            </div>
            
            {/* Relationship Nodes */}
            {relationships.map((rel, index) => {
              // Calculate position in a circle around the center
              const angle = (index / relationships.length) * 2 * Math.PI;
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={rel.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex flex-col items-center">
                    {/* Connection Line */}
                    <div 
                      className="absolute w-px bg-white/30"
                      style={{
                        height: `${radius}px`,
                        transform: `rotate(${angle}rad)`,
                        transformOrigin: 'bottom center',
                        top: `-${radius}px`
                      }}
                    ></div>
                    
                    {/* Node */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-sm text-center p-1">
                        {rel.target.type === 'company' ? (
                          <Building className="w-8 h-8" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-white/80 text-xs bg-dark-bg/80 px-2 py-1 rounded">
                          {rel.target.name}
                        </span>
                      </div>
                      
                      {/* Strength Indicator */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {Math.round(rel.strength * 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Zoom Indicator */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white/80 text-sm">
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary-purple to-accent-pink"></div>
            <span className="text-white/80 text-sm">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20"></div>
            <span className="text-white/80 text-sm">Contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <span className="text-white/80 text-sm">Relationship Strength</span>
          </div>
        </div>
      </GlassCard>

      {/* Relationship List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Relationships</h3>
        <div className="space-y-3">
          {relationships.map((rel) => (
            <div key={rel.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {rel.source.type === 'company' ? (
                    <Building className="w-5 h-5 text-white/60" />
                  ) : (
                    <User className="w-5 h-5 text-white/60" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{rel.source.name}</p>
                  <p className="text-white/60 text-sm">{rel.source.company}</p>
                </div>
              </div>
              
              <div className="text-white/60 text-sm">
                {rel.relationship.replace('_', ' ')}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  {rel.target.type === 'company' ? (
                    <Building className="w-5 h-5 text-white/60" />
                  ) : (
                    <User className="w-5 h-5 text-white/60" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{rel.target.name}</p>
                  <p className="text-white/60 text-sm">{rel.target.company}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${rel.strength * 100}%` }}
                  ></div>
                </div>
                <span className="text-white/80 text-sm w-8">
                  {Math.round(rel.strength * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};