import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, Building,
  TrendingUp, User, Eye, Globe, MapPin, Tag
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import type { Partner } from '@/lib/types/partner';
import { usePartnerStore } from '@/stores/partnerStore';

interface ContactListProps {
  partners: Partner[];
  loading?: boolean;
}

export const ContactList: React.FC<ContactListProps> = ({
  partners,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [filterType, setFilterType] = useState<string>('all');
  const { setSelectedPartner } = usePartnerStore();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getTypeColor = (partner: Partner) => {
    if (partner.isCustomer && partner.isVendor) return 'bg-amber-500/20 text-amber-400';
    if (partner.isCustomer) return 'bg-amber-500/20 text-amber-400';
    if (partner.isVendor) return 'bg-orange-500/20 text-orange-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const getTypeLabel = (partner: Partner) => {
    if (partner.isCustomer && partner.isVendor) return 'Customer & Vendor';
    if (partner.isCustomer) return 'Customer';
    if (partner.isVendor) return 'Vendor';
    return 'Contact';
  };

  const filteredPartners = partners.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'customer') return p.isCustomer;
    if (filterType === 'vendor') return p.isVendor;
    return true;
  });

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <GlassCard key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-white/10 rounded w-full mb-2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-white/60 text-sm">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="name">Name</option>
            <option value="createdAt">Date Added</option>
          </select>
          <span className="text-white/60 text-sm ml-2">Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="all">All ({partners.length})</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
          <span className="text-white/40 text-sm ml-auto">
            {sortedPartners.length} results
          </span>
        </div>
      </GlassCard>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="cursor-pointer"
              onClick={() => setSelectedPartner(partner)}
            >
              <GlassCard className="p-6 hover:bg-white/10 transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(partner.name)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{partner.name}</h3>
                      {partner.jobPosition && (
                        <p className="text-white/60 text-sm">{partner.jobPosition}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parent Company */}
                {partner.parent && (
                  <div className="flex items-center gap-2 mb-3 text-white/70">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">{partner.parent.name}</span>
                  </div>
                )}

                {/* Email */}
                {partner.email && (
                  <div className="flex items-center gap-2 mb-3 text-white/70">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{partner.email}</span>
                  </div>
                )}

                {/* Phone */}
                {partner.phone && (
                  <div className="flex items-center gap-2 mb-3 text-white/70">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{partner.phone}</span>
                  </div>
                )}

                {/* Location */}
                {partner.city && (
                  <div className="flex items-center gap-2 mb-3 text-white/70">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{[partner.city, partner.state, partner.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(partner)}`}>
                    {getTypeLabel(partner)}
                  </span>
                </div>

                {/* Tags */}
                {partner.tags && partner.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {partner.tags.slice(0, 3).map((tag) => (
                      <span key={tag.id} className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag.name}
                      </span>
                    ))}
                    {partner.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded">
                        +{partner.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Hover Actions */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {partner.email && (
                    <button className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  )}
                  {partner.phone && (
                    <button className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1">
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                  )}
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
      {sortedPartners.length === 0 && !loading && (
        <GlassCard className="p-12 text-center">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No contacts found</h3>
          <p className="text-white/60 mb-6">
            {filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first contact'
            }
          </p>
        </GlassCard>
      )}
    </div>
  );
};