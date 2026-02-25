// Contact Hub Module Index
export { ContactHubDashboard } from './components/ContactHubDashboard';
export { ContactList } from './components/ContactList';
export { ContactDetail } from './components/ContactDetail';
export { CompanyList } from './components/CompanyList';
export { CompanyDetail } from './components/CompanyDetail';
export { TimelineView } from './components/TimelineView';
export { RelationshipMap } from './components/RelationshipMap';

// Types
export type { 
  Contact, 
  Company, 
  Activity, 
  Relationship, 
  AppProfile,
  ContactType,
  LifecycleStage,
  ImportanceLevel
} from './types';

// Store
export { useContactHubStore } from './stores/contactHubStore';