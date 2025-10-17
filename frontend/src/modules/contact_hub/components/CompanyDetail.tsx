import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Building, Globe, Users, DollarSign, Calendar, TrendingUp,
  MapPin, Linkedin, Twitter, Facebook, Link, Edit, Mail, Phone
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Company } from '../types';

interface CompanyDetailProps {
  company: Company;
  onClose: () => void;
}

export const CompanyDetail: React.FC<CompanyDetailProps> = ({ company, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'activities' | 'financials'>('overview');

  const getHealthColor = (score?: number) => {
    if (!score) return 'from-gray-500 to-gray-600';
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-green-500';
    if (score >= 40) return 'from-orange-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  const getHealthLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Stable';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="ml-auto w-full max-w-4xl bg-dark-bg/90 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-bg/80 backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white font-bold text-2xl">
                {company.name?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{company.name}</h2>
                {company.domain && (
                  <p className="text-white/70 flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {company.domain}
                  </p>
                )}
                {company.industry && (
                  <p className="text-white/60">{company.industry}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Health Score</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getHealthColor(company.health_score)} flex items-center justify-center`}>
                  <span className="text-white font-bold">
                    {company.health_score?.toFixed(0) || 'N/A'}
                  </span>
                </div>
                <span className="text-white">
                  {getHealthLabel(company.health_score)}
                </span>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Employees</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {company.employee_count?.toLocaleString() || 'N/A'}
              </p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Annual Revenue</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {company.annual_revenue ? `$${(company.annual_revenue / 1000000).toFixed(1)}M` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'contacts', 'activities', 'financials'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-6 py-4 font-medium capitalize transition-colors relative
                ${activeTab === tab
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
                }
              `}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeCompanyTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-purple to-accent-pink"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Company Information */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Company Information</h3>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {company.description && (
                      <div>
                        <p className="text-white/60 text-sm mb-1">Description</p>
                        <p className="text-white">{company.description}</p>
                      </div>
                    )}
                    
                    {company.founded_year && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Founded</p>
                          <p className="text-white">{company.founded_year}</p>
                        </div>
                      </div>
                    )}
                    
                    {company.headquarters && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <MapPin className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Headquarters</p>
                          <p className="text-white">{company.headquarters}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.website && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Link className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Website</p>
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-purple hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {company.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Mail className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Email</p>
                          <a 
                            href={`mailto:${company.email}`} 
                            className="text-primary-purple hover:underline"
                          >
                            {company.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Phone className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Phone</p>
                          <a 
                            href={`tel:${company.phone}`} 
                            className="text-primary-purple hover:underline"
                          >
                            {company.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Technologies */}
              {company.technologies_used && company.technologies_used.length > 0 && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Technologies Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.technologies_used.map((tech, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 bg-gradient-to-r from-primary-purple/30 to-accent-pink/30 text-white rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Social Profiles */}
              {(company.social_profiles?.linkedin || company.social_profiles?.twitter) && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Profiles</h3>
                  <div className="flex gap-3">
                    {company.social_profiles?.linkedin && (
                      <a 
                        href={company.social_profiles.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                        <span className="text-white">LinkedIn</span>
                      </a>
                    )}
                    {company.social_profiles?.twitter && (
                      <a 
                        href={company.social_profiles.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                        <span className="text-white">Twitter</span>
                      </a>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Associated Contacts</h3>
              <p className="text-white/60">Contact association coming soon...</p>
            </GlassCard>
          )}

          {activeTab === 'activities' && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Activities</h3>
              <p className="text-white/60">Activity tracking coming soon...</p>
            </GlassCard>
          )}

          {activeTab === 'financials' && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Financial Information</h3>
              <p className="text-white/60">Financial data coming soon...</p>
            </GlassCard>
          )}
        </div>
      </motion.div>
    </div>
  );
};