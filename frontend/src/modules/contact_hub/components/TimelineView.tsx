import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, Calendar, Search, User, Building, 
  Mail, Phone, MessageSquare, FileText, DollarSign
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';

export const TimelineView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterContact, setFilterContact] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  // Mock timeline data
  const timelineEvents = [
    {
      id: '1',
      type: 'email',
      title: 'Proposal Sent',
      description: 'Sent premium plan proposal to Acme Corp',
      contact: 'John Doe',
      company: 'Acme Corp',
      timestamp: '2024-01-15T14:30:00Z',
      app: 'Sales'
    },
    {
      id: '2',
      type: 'call',
      title: 'Follow-up Call',
      description: 'Discussed implementation timeline with Jane Smith',
      contact: 'Jane Smith',
      company: 'Tech Solutions',
      timestamp: '2024-01-15T11:15:00Z',
      app: 'CRM'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Product Demo',
      description: 'Conducted product demo for Global Enterprises team',
      contact: 'Robert Johnson',
      company: 'Global Enterprises',
      timestamp: '2024-01-14T16:45:00Z',
      app: 'Sales'
    },
    {
      id: '4',
      type: 'email',
      title: 'Welcome Email',
      description: 'Sent welcome email to new customer',
      contact: 'Sarah Wilson',
      company: 'Innovate Inc',
      timestamp: '2024-01-14T09:20:00Z',
      app: 'Marketing'
    },
    {
      id: '5',
      type: 'invoice',
      title: 'Invoice Generated',
      description: 'Generated invoice #INV-2024-001 for Acme Corp',
      contact: 'John Doe',
      company: 'Acme Corp',
      timestamp: '2024-01-13T13:45:00Z',
      app: 'Accounting'
    },
    {
      id: '6',
      type: 'support',
      title: 'Support Ticket',
      description: 'Resolved issue with API integration',
      contact: 'Michael Brown',
      company: 'Tech Solutions',
      timestamp: '2024-01-13T10:30:00Z',
      app: 'Helpdesk'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <User className="w-4 h-4" />;
      case 'invoice': return <DollarSign className="w-4 h-4" />;
      case 'support': return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-500/20 text-blue-400';
      case 'call': return 'bg-green-500/20 text-green-400';
      case 'meeting': return 'bg-purple-500/20 text-purple-400';
      case 'invoice': return 'bg-yellow-500/20 text-yellow-400';
      case 'support': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredEvents = timelineEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || event.type === filterType;
    // Add more filter logic as needed
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search timeline events..."
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
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="invoice">Invoice</option>
            <option value="support">Support</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </GlassCard>

      {/* Timeline */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Activity Timeline</h2>
        
        <div className="space-y-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex gap-4">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(event.type)}`}>
                      {getTypeIcon(event.type)}
                    </div>
                    {index < filteredEvents.length - 1 && (
                      <div className="w-0.5 h-full bg-white/20 mt-1"></div>
                    )}
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <p className="text-white/70 mt-1">{event.description}</p>
                      </div>
                      <span className="text-white/60 text-sm whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.contact}
                      </span>
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {event.company}
                      </span>
                      <span className="px-2 py-1 bg-gradient-to-r from-primary-purple/30 to-accent-pink/30 text-white text-xs rounded">
                        {event.app}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
              <p className="text-white/60">
                Try adjusting your search or filters to see more results.
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};