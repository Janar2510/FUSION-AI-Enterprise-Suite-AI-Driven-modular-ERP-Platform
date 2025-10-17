import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Mail, Phone, Building, 
  Star, TrendingUp, Clock, User, Eye
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Contact } from '../types';

interface ContactListProps {
  contacts: Contact[];
  onSearch?: (query: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ 
  contacts, 
  onSearch 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'engagement_score' | 'created_at' | 'last_activity_at'>('engagement_score');
  const [filterType, setFilterType] = useState<string>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-red-500 to-orange-500';
    if (score >= 60) return 'from-yellow-500 to-green-500';
    if (score >= 40) return 'from-blue-500 to-cyan-500';
    return 'from-gray-500 to-gray-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Engagement 🔥';
    if (score >= 60) return 'Engaged ✓';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'person': return 'bg-blue-500/20 text-blue-400';
      case 'company': return 'bg-green-500/20 text-green-400';
      case 'customer': return 'bg-purple-500/20 text-purple-400';
      case 'vendor': return 'bg-orange-500/20 text-orange-400';
      case 'employee': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || contact.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    switch (sortBy) {
      case 'engagement_score':
        return (b.engagement_score || 0) - (a.engagement_score || 0);
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'last_activity_at':
        return new Date(b.last_activity_at || 0).getTime() - new Date(a.last_activity_at || 0).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts, emails, companies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
          >
            <option value="engagement_score">Engagement Score</option>
            <option value="created_at">Date Added</option>
            <option value="last_activity_at">Last Activity</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
          >
            <option value="all">All Types</option>
            <option value="person">Person</option>
            <option value="company">Company</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="employee">Employee</option>
          </select>

          {/* Add Contact Button */}
          <button className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Contact
          </button>
        </div>
      </GlassCard>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="cursor-pointer"
            >
              <GlassCard className="p-6 hover:bg-white/10 transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white font-bold text-lg">
                      {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                      </h3>
                      <p className="text-white/60 text-sm">{contact.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(contact.engagement_score || 0)} text-white text-xs font-bold`}>
                      {contact.engagement_score?.toFixed(0) || 0}
                    </div>
                    <span className="text-white/40 text-xs">
                      {getScoreLabel(contact.engagement_score || 0)}
                    </span>
                  </div>
                </div>

                {/* Company */}
                {contact.company_name && (
                  <div className="flex items-center gap-2 mb-4 text-white/70">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">{contact.company_name}</span>
                  </div>
                )}

                {/* Email */}
                {contact.email && (
                  <div className="flex items-center gap-2 mb-4 text-white/70">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{contact.email}</span>
                  </div>
                )}

                {/* Type and Engagement */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(contact.type)}`}>
                    {contact.type}
                  </span>
                  <div className="flex items-center gap-1 text-white/60">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">{contact.engagement_score?.toFixed(1) || 0}%</span>
                  </div>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {contact.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Last Activity */}
                {contact.last_activity_at && (
                  <div className="flex items-center gap-2 text-white/60 text-xs mb-4">
                    <Clock className="w-3 h-3" />
                    <span>
                      Last activity: {new Date(contact.last_activity_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedContacts.length === 0 && (
        <GlassCard className="p-12 text-center">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No contacts found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first contact'
            }
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add First Contact
          </button>
        </GlassCard>
      )}
    </div>
  );
};