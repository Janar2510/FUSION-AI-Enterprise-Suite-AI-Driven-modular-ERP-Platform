// CRM Module Exports
export { CRMModule } from './components/CRMModule';
export { useCRMStore } from './stores/crmStore';
export * from './types';

// Re-export commonly used types
export type {
  Contact,
  Opportunity,
  Interaction,
  CRMAnalytics,
  CRMDashboard as CRMDashboardType,
  SalesPipeline,
  ContactCreateRequest,
  ContactUpdateRequest,
  OpportunityCreateRequest,
  OpportunityUpdateRequest,
  InteractionCreateRequest,
  InteractionUpdateRequest,
  CRMFilter,
  CRMInsights,
  LeadScore,
  ContactType,
  LeadStatus,
  OpportunityStage,
  InteractionType
} from './types';




