import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Building, Globe, Users, TrendingUp, 
  DollarSign, Calendar, Eye
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Company } from '../types';

interface CompanyListProps {
  companies: Company[];
}

export const CompanyList: React.FC<CompanyListProps> = ({ companies }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'employee_count' | 'annual_revenue' | 'created_at'>('name');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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

  const getChurnRiskColor = (risk?: number) => {
    if (!risk) return 'from-gray-500 to-gray-600';
    if (risk >= 80) return 'from-red-500 to-orange-500';
    if (risk >= 60) return 'from-orange-500 to-yellow-500';
    if (risk >= 40) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  const getChurnRiskLabel = (risk?: number) => {
    if (!risk) return 'Unknown';
    if (risk >= 80) return 'High Risk';
    if (risk >= 60) return 'Medium Risk';
    if (risk >= 40) return 'Low Risk';
    return 'Stable';
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterIndustry === 'all' || company.industry === filterIndustry;
    
    return matchesSearch && matchesFilter;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'employee_count':
        return (b.employee_count || 0) - (a.employee_count || 0);
      case 'annual_revenue':
        return (b.annual_revenue || 0) - (a.annual_revenue || 0);
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[];

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
              placeholder="Search companies, domains, industries..."
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
            <option value="name">Company Name</option>
            <option value="employee_count">Employee Count</option>
            <option value="annual_revenue">Annual Revenue</option>
            <option value="created_at">Date Added</option>
          </select>

          {/* Industry Filter */}
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50"
          >
            <option value="all">All Industries</option>
            {industries.map((industry, idx) => (
              <option key={idx} value={industry}>{industry}</option>
            ))}
          </select>

          {/* Add Company Button */}
          <button className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Company
          </button>
        </div>
      </GlassCard>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedCompanies.map((company, index) => (
            <motion.div
              key={company.id}
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
                      {company.name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {company.name}
                      </h3>
                      {company.domain && (
                        <p className="text-white/60 text-sm flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {company.domain}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {company.account_status && (
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${company.account_status === 'customer' ? 'bg-green-500/20 text-green-400' : 
                        company.account_status === 'prospect' ? 'bg-blue-500/20 text-blue-400' : 
                        'bg-gray-500/20 text-gray-400'}
                    `}>
                      {company.account_status}
                    </span>
                  )}
                </div>

                {/* Industry */}
                {company.industry && (
                  <div className="flex items-center gap-2 mb-4 text-white/70">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">{company.industry}</span>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 p-2 rounded">
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <Users className="w-3 h-3" />
                      <span>Employees</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {company.employee_count?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 p-2 rounded">
                    <div className="flex items-center gap-1 text-white/60 text-xs">
                      <DollarSign className="w-3 h-3" />
                      <span>Revenue</span>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {company.annual_revenue ? `$${(company.annual_revenue / 1000000).toFixed(1)}M` : 'N/A'}
                    </p>
                  </div>
                  
                  {company.health_score !== undefined && (
                    <div className="bg-white/5 p-2 rounded">
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        <span>Health</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getHealthColor(company.health_score)}`}></div>
                        <p className="text-white font-semibold text-sm">
                          {company.health_score?.toFixed(0) || 'N/A'}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {company.churn_risk !== undefined && (
                    <div className="bg-white/5 p-2 rounded">
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <span>Churn</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getChurnRiskColor(company.churn_risk)}`}></div>
                        <p className="text-white font-semibold text-sm">
                          {company.churn_risk?.toFixed(0) || 'N/A'}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Technologies */}
                {company.technologies_used && company.technologies_used.length > 0 && (
                  <div className="mb-4">
                    <p className="text-white/60 text-xs mb-1">Technologies</p>
                    <div className="flex flex-wrap gap-1">
                      {company.technologies_used.slice(0, 3).map((tech, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                      {company.technologies_used.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                          +{company.technologies_used.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Since */}
                {company.customer_since && (
                  <div className="flex items-center gap-2 text-white/60 text-xs mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Customer since: {new Date(company.customer_since).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm flex items-center justify-center gap-1">
                    View Details
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
      {sortedCompanies.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Building className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || filterIndustry !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first company'
            }
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add First Company
          </button>
        </GlassCard>
      )}
    </div>
  );
};