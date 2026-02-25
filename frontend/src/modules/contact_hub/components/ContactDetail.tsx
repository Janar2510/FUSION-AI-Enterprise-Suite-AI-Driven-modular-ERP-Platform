import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Phone, Smartphone, MapPin, Building, User, Calendar,
  TrendingUp, Activity, MessageSquare, Edit, Star, Tag, Globe,
  Linkedin, Twitter, Facebook, Link
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { Contact, TimelineEvent } from '../types';
import { useContactHubStore } from '../stores/contactHubStore';

interface ContactDetailProps {
  contactId?: string;
  contact?: Contact;
  onClose: () => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ 
  contactId, 
  contact: propContact,
  onClose 
}) => {
  const [contact, setContact] = useState<Contact | null>(propContact || null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'relationships' | 'profiles'>('overview');
  const [loading, setLoading] = useState(false);
  
  const { getContact, fetchContactTimeline } = useContactHubStore();

  useEffect(() => {
    const loadContact = async () => {
      if (contactId && !propContact) {
        setLoading(true);
        try {
          const fetchedContact = await getContact(contactId);
          setContact(fetchedContact);
        } catch (error) {
          console.error('Failed to load contact:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadContact();
  }, [contactId, propContact, getContact]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (contactId) {
        try {
          await fetchContactTimeline(contactId, 20);
        } catch (error) {
          console.error('Failed to load timeline:', error);
        }
      }
    };

    loadTimeline();
  }, [contactId, fetchContactTimeline]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <GlassCard className="p-8">
          <p className="text-white">Loading contact details...</p>
        </GlassCard>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <GlassCard className="p-8">
          <p className="text-white">Contact not found</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary-purple text-white rounded-lg"
          >
            Close
          </button>
        </GlassCard>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-red-500 to-orange-500';
    if (score >= 60) return 'from-yellow-500 to-green-500';
    if (score >= 40) return 'from-blue-500 to-cyan-500';
    return 'from-gray-500 to-gray-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Highly Engaged';
    if (score >= 60) return 'Engaged';
    if (score >= 40) return 'Moderately Engaged';
    return 'Low Engagement';
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
                {contact.first_name?.[0]}{contact.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                </h2>
                <p className="text-white/70">{contact.title}</p>
                {contact.company_name && (
                  <p className="text-white/60 flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {contact.company_name}
                  </p>
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

        {/* Engagement Score */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Engagement Score</h3>
            <span className="text-white/60 text-sm">
              {getScoreLabel(contact.engagement_score || 0)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getScoreColor(contact.engagement_score || 0)} flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">
                {contact.engagement_score?.toFixed(0) || 0}
              </span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(contact.engagement_score || 0)}`}
                  style={{ width: `${contact.engagement_score || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'timeline', 'relationships', 'profiles'] as const).map((tab) => (
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
                  layoutId="activeDetailTab"
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
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Contact Information */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contact.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Mail className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Email</p>
                          <p className="text-white">{contact.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {contact.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Phone className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Phone</p>
                          <p className="text-white">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {contact.mobile && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Smartphone className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Mobile</p>
                          <p className="text-white">{contact.mobile}</p>
                        </div>
                      </div>
                    )}
                    
                    {(contact.address_line1 || contact.city) && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <MapPin className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm">Address</p>
                          <p className="text-white">
                            {contact.address_line1}
                            {contact.city && `, ${contact.city}`}
                            {contact.state && `, ${contact.state}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Social Profiles */}
                {(contact.custom_fields?.linkedin || contact.custom_fields?.twitter) && (
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Social Profiles</h3>
                    <div className="flex gap-3">
                      {contact.custom_fields?.linkedin && (
                        <a 
                          href={contact.custom_fields.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                          <span className="text-white">LinkedIn</span>
                        </a>
                      )}
                      {contact.custom_fields?.twitter && (
                        <a 
                          href={contact.custom_fields.twitter} 
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

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-gradient-to-r from-primary-purple/30 to-accent-pink/30 text-white rounded-full text-sm flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Custom Fields */}
                {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(contact.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
                  <div className="space-y-4">
                    {timelineEvents.length > 0 ? (
                      timelineEvents.map((event) => (
                        <div key={event.id} className="flex gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary-purple"></div>
                            <div className="w-0.5 h-full bg-white/20 mt-1"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white">{event.title}</h4>
                              <span className="text-white/60 text-sm">
                                {new Date(event.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-white/70 text-sm mt-1">{event.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                                {event.app_name}
                              </span>
                              <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                                {event.activity_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/60 text-center py-8">No activity yet</p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'relationships' && (
              <motion.div
                key="relationships"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Relationships</h3>
                  <p className="text-white/60">Relationship mapping coming soon...</p>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'profiles' && (
              <motion.div
                key="profiles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">App Profiles</h3>
                  <p className="text-white/60">App-specific profiles coming soon...</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};