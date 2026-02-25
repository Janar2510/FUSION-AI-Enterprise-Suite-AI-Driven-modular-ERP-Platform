import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Globe, Mail, Phone, MapPin, Users,
  Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import type { Partner } from '@/lib/types/partner';
import { usePartnerStore } from '@/stores/partnerStore';

interface CompanyListProps {
  partners: Partner[];
  loading?: boolean;
}

export const CompanyList: React.FC<CompanyListProps> = ({
  partners,
  loading = false
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { setSelectedPartner } = usePartnerStore();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <GlassCard key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/10" />
              <div className="flex-1">
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {partners.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-6 hover:bg-white/10 transition-all">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(company.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-xl">{company.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {company.isCustomer && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Customer</span>
                      )}
                      {company.isVendor && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">Vendor</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60"
                  >
                    {expandedId === company.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {company.email && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate">
                        {company.website}
                      </a>
                    </div>
                  )}
                  {(company.city || company.country) && (
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">
                        {[company.street, company.city, company.state, company.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === company.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      {company.vat && (
                        <div className="flex items-center gap-2 text-white/70 mb-2">
                          <span className="text-xs text-white/40">VAT:</span>
                          <span className="text-sm">{company.vat}</span>
                        </div>
                      )}
                      {company.children && company.children.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Contacts ({company.children.length})
                          </h4>
                          <div className="space-y-1">
                            {company.children.slice(0, 5).map((child) => (
                              <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer"
                                onClick={() => setSelectedPartner(child)}>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white text-xs font-bold">
                                  {getInitials(child.name)}
                                </div>
                                <span className="text-white text-sm">{child.name}</span>
                                {child.jobPosition && <span className="text-white/40 text-xs ml-auto">{child.jobPosition}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {company.tags && company.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {company.tags.map(tag => (
                            <span key={tag.id} className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setSelectedPartner(company)}
                          className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {partners.length === 0 && !loading && (
        <GlassCard className="p-12 text-center">
          <Building className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
          <p className="text-white/60">Add your first company to get started.</p>
        </GlassCard>
      )}
    </div>
  );
};