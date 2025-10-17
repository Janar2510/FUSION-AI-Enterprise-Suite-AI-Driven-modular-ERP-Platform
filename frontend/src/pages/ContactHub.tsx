import React, { lazy, Suspense } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';

// Lazy load the contact hub dashboard to improve initial load time
const ContactHubDashboard = lazy(() => import('@/modules/contact_hub/components/ContactHubDashboard'));

export const ContactHub: React.FC = () => {
  return (
    <div className="w-full">
      <Suspense fallback={
        <GlassCard className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-purple mb-4"></div>
              <p className="text-white">Loading Contact Hub...</p>
            </div>
          </div>
        </GlassCard>
      }>
        <ContactHubDashboard />
      </Suspense>
    </div>
  );
};

export default ContactHub;