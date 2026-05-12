import React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'

// Import module components
import { DashboardLayout } from '@/modules/dashboard'
import { DocumentManager } from '@/modules/documents'
import { SignMain } from '@/modules/sign'
import { DiscussMain } from '@/modules/discuss'
import { CRMModule } from '@/modules/crm/components/CRMModule'
import { SalesModule } from '@/modules/sales/components/SalesModule'
import { InventoryModule } from '@/modules/inventory/components/InventoryModule'
import { StorefrontModule } from '@/modules/ecommerce'
import { AccountingModule } from '@/modules/accounting/components/AccountingModule'
import { HRModule } from '@/modules/hr/components/HRModule'
import { ProjectModule } from '@/modules/project/components/ProjectModule'
import { HelpdeskModule } from '@/modules/helpdesk/components/HelpdeskModule'
import SubscriptionsDashboard from '@/modules/subscriptions/components/SubscriptionsDashboard'
import { POSModule } from '@/modules/pos/components/POSModule'
import { RentalModule } from '@/modules/rental/components/RentalModule'
import { TimesheetsModule } from '@/modules/timesheets/components/TimesheetsModule'
import PlanningDashboard from '@/modules/planning/components/PlanningDashboard'
import { FieldServiceModule } from '@/modules/field-service/components/FieldServiceModule'
import { KnowledgeModule } from '@/modules/knowledge/components/KnowledgeModule'
import { WebsiteModule } from '@/modules/website/components/WebsiteModule'
import { EmailMarketingModule } from '@/modules/email-marketing/components/EmailMarketingModule'
import { SocialMarketingModule } from '@/modules/social-marketing/components/SocialMarketingModule'
import InvoicingDashboard from '@/modules/invoicing/components/InvoicingDashboard'
import { StudioModule } from '@/modules/studio/components/StudioModule'
import { PurchasesModule } from '@/modules/purchases/components/PurchasesModule'
import MarketingDashboard from '@/modules/marketing/components/MarketingDashboard'
import { CalendarModule } from '@/modules/calendar/components/CalendarModule'
import { EventsModule } from '@/modules/events/components/EventsModule'
import { FleetModule } from '@/modules/fleet/components/FleetModule'
import { MaintenanceModule } from '@/modules/maintenance/components/MaintenanceModule'
import { SurveysModule } from '@/modules/surveys/components/SurveysModule'
import { NotesModule } from '@/modules/notes/components/NotesModule'
import { LeavesModule } from '@/modules/leaves/components/LeavesModule'
import { ExpensesModule } from '@/modules/expenses/components/ExpensesModule'
import { RecruitmentModule } from '@/modules/recruitment/components/RecruitmentModule'
import { AttendanceModule } from '@/modules/attendance/components/AttendanceModule'
import { PayrollModule } from '@/modules/payroll/components/PayrollModule'
import { AppraisalsModule } from '@/modules/appraisals/components/AppraisalsModule'
import { QualityModule } from '@/modules/quality/components/QualityModule'
import { PlmModule } from '@/modules/plm/components/PlmModule'
import { SpreadsheetModule } from '@/modules/spreadsheet/components/SpreadsheetModule'
import { AutomationModule } from '@/modules/automation/components/AutomationModule'
import { ManufacturingModule } from '@/modules/manufacturing'
import SupplyChainModule from '@/modules/supply-chain/components/SupplyChainModule'

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
        return <CRMModule />
      case 'sales':
        return <SalesModule />
      case 'inventory':
        return <InventoryModule />
      case 'ecommerce':
        return <StorefrontModule />
      case 'accounting':
        return <AccountingModule />
      case 'hr':
        return <HRModule />
      case 'project':
        return <ProjectModule />
      case 'helpdesk':
        return <HelpdeskModule />
      case 'subscriptions':
        return <SubscriptionsDashboard />
      case 'pos':
        return <POSModule />
      case 'rental':
        return <RentalModule />
      case 'timesheets':
        return <TimesheetsModule />
      case 'planning':
        return <PlanningDashboard />
      case 'field_service':
        return <FieldServiceModule />
      case 'knowledge':
        return <KnowledgeModule />
      case 'website':
        return <WebsiteModule />
      case 'email_marketing':
        return <EmailMarketingModule />
      case 'social_marketing':
        return <SocialMarketingModule />
      case 'studio':
        return <StudioModule />
      case 'manufacturing':
        return <ManufacturingModule />
      case 'purchases':
        return <PurchasesModule />
      case 'marketing':
        return <MarketingDashboard />
      case 'calendar':
        return <CalendarModule />
      case 'events':
        return <EventsModule />
      case 'fleet':
        return <FleetModule />
      case 'maintenance':
        return <MaintenanceModule />
      case 'surveys':
        return <SurveysModule />
      case 'notes':
        return <NotesModule />
      case 'leaves':
        return <LeavesModule />
      case 'expenses':
        return <ExpensesModule />
      case 'recruitment':
        return <RecruitmentModule />
      case 'attendance':
        return <AttendanceModule />
      case 'payroll':
        return <PayrollModule />
      case 'appraisals':
        return <AppraisalsModule />
      case 'quality':
        return <QualityModule />
      case 'plm':
        return <PlmModule />
      case 'spreadsheet':
        return <SpreadsheetModule />
      case 'automation':
        return <AutomationModule />
      case 'supply_chain':
        return <SupplyChainModule />
      case 'invoicing':
        return <InvoicingDashboard />
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
    <div className="h-full min-w-0">
      {renderModule()}
    </div>
  )
}

export default ModulePage
