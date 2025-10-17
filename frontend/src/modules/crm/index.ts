// CRM Module Exports
export { CRMDashboard } from './components/CRMDashboard';
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




