import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Mail, Phone, Building, MapPin, Calendar, 
  TrendingUp, Activity, Clock, Tag, Star, Send,
  User, DollarSign, Target, Eye
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useCRMStore } from '@/stores/crmStore';

interface ContactDetailProps {
  contact: any;
  onClose: () => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ contact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'insights' | 'actions'>('overview');
  const [leadScore, setLeadScore] = useState(null);
  const [nextAction, setNextAction] = useState(null);
  const [emailDraft, setEmailDraft] = useState('');
  
  const { 
    getContact,
    scoreContact,
    generateEmail,
    updateContact 
  } = useCRMStore();

  useEffect(() => {
    loadContactDetails();
  }, [contact.id]);

  const loadContactDetails = async () => {
    try {
      const details = await getContact(contact.id);
      setLeadScore(details.lead_scoring);
      setNextAction(details.next_best_action);
    } catch (error) {
      console.error('Failed to load contact details:', error);
    }
  };

  const handleScoreLead = async () => {
    try {
      const score = await scoreContact(contact.id);
      setLeadScore(score);
    } catch (error) {
      console.error('Failed to score lead:', error);
    }
  };

  const handleGenerateEmail = async (purpose: string) => {
    try {
      const email = await generateEmail(contact.id, purpose);
      setEmailDraft(email.primary_version.body);
    } catch (error) {
      console.error('Failed to generate email:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-red-500 to-orange-500';
    if (score >= 60) return 'from-yellow-500 to-green-500';
    if (score >= 40) return 'from-blue-500 to-cyan-500';
    return 'from-gray-500 to-gray-600';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'actions', label: 'Actions', icon: Send },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <GlassCard className="h-full flex flex-col" glow>
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white text-xl font-bold">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                  </h2>
                  <p className="text-white/60">{contact.job_title}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-white/80 hover:text-white flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-white/80 hover:text-white flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Lead Score Badge */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getScoreColor(contact.lead_score || 0)} text-white font-bold`}>
                  Score: {contact.lead_score || 0}
                </div>
                <span className="text-white/80">
                  {leadScore?.qualification || 'Not Scored'}
                </span>
              </div>
              <button
                onClick={handleScoreLead}
                className="px-3 py-1 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 text-sm"
              >
                Refresh Score
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    px-4 py-2 rounded-lg capitalize transition-all flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'bg-primary-purple text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {contact.company && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Building className="w-4 h-4 text-white/60" />
                        <span>{contact.company.name}</span>
                      </div>
                    )}
                    {contact.city && (
                      <div className="flex items-center gap-2 text-white/80">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span>{contact.city}, {contact.state} {contact.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Engagement Metrics */}
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Engagement Score</span>
                      <span className="text-white font-medium">{contact.engagement_score?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Interactions</span>
                      <span className="text-white font-medium">{contact.total_interactions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Email Opens</span>
                      <span className="text-white font-medium">{contact.email_opens || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Activity</span>
                      <span className="text-white font-medium">
                        {contact.last_activity 
                          ? new Date(contact.last_activity).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* AI Insights */}
                {leadScore && (
                  <GlassCard className="p-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">AI Lead Analysis</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-white/60 mb-2">Scoring Factors:</p>
                        <div className="space-y-1">
                          {leadScore.scoring_factors?.map((factor: string, i: number) => (
                            <div key={i} className="text-white/80 text-sm">
                              • {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {leadScore.recommended_action && (
                        <div className="p-3 bg-accent-pink/20 rounded-lg">
                          <p className="text-accent-pink font-medium">Recommended Action:</p>
                          <p className="text-white/80 mt-1">{leadScore.recommended_action}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'insights' && nextAction && (
              <div className="space-y-6">
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Next Best Action
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/60">Action:</p>
                      <p className="text-white font-medium">{nextAction.action}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Channel:</p>
                      <p className="text-white">{nextAction.channel}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Optimal Timing:</p>
                      <p className="text-white">{nextAction.timing}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleGenerateEmail('follow_up')}
                    className="px-4 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Follow-up Email
                  </button>
                  <button 
                    onClick={() => handleGenerateEmail('proposal')}
                    className="px-4 py-3 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Proposal
                  </button>
                  <button className="px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </button>
                  <button className="px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Log Call
                  </button>
                </div>

                {/* Email Draft */}
                {emailDraft && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Generated Email</h3>
                    <textarea
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      className="w-full h-48 p-3 bg-white/5 border border-white/20 rounded-lg text-white resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                        Save Draft
                      </button>
                      <button className="px-4 py-2 bg-gradient-to-r from-primary-purple to-accent-pink text-white rounded-lg">
                        Send Email
                      </button>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <GlassCard className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
                <p className="text-white/60">Timeline feature coming soon...</p>
              </GlassCard>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};


