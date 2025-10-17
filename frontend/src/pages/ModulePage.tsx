import React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'

// Import module components
import { DashboardLayout } from '@/modules/dashboard'
import { DocumentManager } from '@/modules/documents'
import { SignMain } from '@/modules/sign'
import { DiscussMain } from '@/modules/discuss'
import { CRMDashboard } from '@/modules/crm/components/CRMDashboard'
import SalesDashboard from '@/modules/sales/components/SalesDashboard'
import InventoryDashboard from '@/modules/inventory/components/InventoryDashboard'
import AccountingDashboard from '@/modules/accounting/components/AccountingDashboard'
import HRDashboard from '@/modules/hr/components/HRDashboard'
import ProjectDashboard from '@/modules/project/components/ProjectDashboard'
import HelpdeskDashboard from '@/modules/helpdesk/components/HelpdeskDashboard'
import SubscriptionsDashboard from '@/modules/subscriptions/components/SubscriptionsDashboard'
import POSDashboard from '@/modules/pos/components/POSDashboard'
import RentalDashboard from '@/modules/rental/components/RentalDashboard'
import TimesheetsDashboard from '@/modules/timesheets/components/TimesheetsDashboard'
import PlanningDashboard from '@/modules/planning/components/PlanningDashboard'
import FieldServiceDashboard from '@/modules/field-service/components/FieldServiceDashboard'
import KnowledgeDashboard from '@/modules/knowledge/components/KnowledgeDashboard'
import WebsiteDashboard from '@/modules/website/components/WebsiteDashboard'
import EmailMarketingDashboard from '@/modules/email-marketing/components/EmailMarketingDashboard'
import SocialMarketingDashboard from '@/modules/social-marketing/components/SocialMarketingDashboard'
import StudioDashboard from '@/modules/studio/components/StudioDashboard'
import ManufacturingDashboard from '@/modules/manufacturing/components/ManufacturingDashboard'
import MarketingDashboard from '@/modules/marketing/components/MarketingDashboard'

const ModulePage: React.FC = () => {
  const { moduleName } = useParams<{ moduleName: string }>()

  const renderModule = () => {
    switch (moduleName) {
      case 'dashboard':
        return <DashboardLayout />
      case 'documents':
        return <DocumentManager />
      case 'sign':
        return <SignMain />
      case 'discuss':
        return <DiscussMain />
      case 'crm':
        return <CRMDashboard />
      case 'sales':
        return <SalesDashboard />
      case 'inventory':
        return <InventoryDashboard />
      case 'accounting':
        return <AccountingDashboard />
      case 'hr':
        return <HRDashboard />
      case 'project':
        return <ProjectDashboard />
      case 'helpdesk':
        return <HelpdeskDashboard />
      case 'subscriptions':
        return <SubscriptionsDashboard />
      case 'pos':
        return <POSDashboard />
      case 'rental':
        return <RentalDashboard />
      case 'timesheets':
        return <TimesheetsDashboard />
      case 'planning':
        return <PlanningDashboard />
      case 'field-service':
        return <FieldServiceDashboard />
      case 'knowledge':
        return <KnowledgeDashboard />
      case 'website':
        return <WebsiteDashboard />
      case 'email-marketing':
        return <EmailMarketingDashboard />
      case 'social-marketing':
        return <SocialMarketingDashboard />
      case 'studio':
        return <StudioDashboard />
      case 'manufacturing':
        return <ManufacturingDashboard />
      case 'marketing':
        return <MarketingDashboard />
      default:
        return (
          <GlassCard className="p-8">
            <div className="text-center">
              <h2 className="heading-2 mb-4">Module Coming Soon</h2>
              <p className="text-white/70 mb-8">
                The {moduleName?.replace('-', ' ')} module is currently under development.
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚀
              </motion.div>
            </div>
          </GlassCard>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {renderModule()}
    </div>
  )
}

export default ModulePage
