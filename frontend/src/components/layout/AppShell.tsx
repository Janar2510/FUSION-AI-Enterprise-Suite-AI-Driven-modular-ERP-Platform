import React, { useState } from 'react'
import { TopBar, AppNavItem } from '@/components/ui/TopBar'
import { SubNav, SubNavSection } from '@/components/ui/SubNav'
import { FusionToaster } from '@/components/ui'

const APP_NAV: AppNavItem[] = [
  { key: 'dashboard',    label: 'Dashboard',    path: '/' },
  { key: 'crm',          label: 'CRM',          path: '/module/crm' },
  { key: 'sales',        label: 'Sales',        path: '/module/sales' },
  { key: 'accounting',   label: 'Accounting',   path: '/module/accounting' },
  { key: 'inventory',    label: 'Inventory',    path: '/module/inventory' },
  { key: 'purchases',    label: 'Purchases',    path: '/module/purchases' },
  { key: 'helpdesk',     label: 'Helpdesk',     path: '/module/helpdesk' },
  { key: 'hr',           label: 'HR',           path: '/module/hr' },
  { key: 'manufacturing',label: 'Manufacturing',path: '/module/manufacturing' },
  { key: 'project',      label: 'Project',      path: '/module/project' },
  { key: 'timesheets',   label: 'Timesheets',   path: '/module/timesheets' },
  { key: 'discuss',      label: 'Discuss',      path: '/module/discuss' },
  { key: 'knowledge',    label: 'Knowledge',    path: '/module/knowledge' },
  { key: 'documents',    label: 'Documents',    path: '/module/documents' },
  { key: 'calendar',     label: 'Calendar',     path: '/module/calendar' },
  { key: 'events',       label: 'Events',       path: '/module/events' },
  { key: 'website',      label: 'Website',      path: '/module/website' },
  { key: 'ecommerce',    label: 'eCommerce',    path: '/module/ecommerce' },
  { key: 'pos',          label: 'POS',          path: '/module/pos' },
]

const DEFAULT_SUBNAV: SubNavSection[] = [
  {
    title: 'Menu',
    items: [
      { key: 'overview',  label: 'Overview',  path: '#' },
      { key: 'list',      label: 'List',      path: '#' },
      { key: 'kanban',    label: 'Kanban',    path: '#' },
      { key: 'reports',   label: 'Reports',   path: '#' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { key: 'settings',    label: 'Settings',    path: '#' },
      { key: 'roles',       label: 'Roles',       path: '#' },
      { key: 'automations', label: 'Automations', path: '#' },
    ],
  },
]

interface AppShellContextValue {
  setSubNavSections: (sections: SubNavSection[]) => void
}

export const AppShellContext = React.createContext<AppShellContextValue>({
  setSubNavSections: () => undefined,
})

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [subNavSections, setSubNavSections] = useState<SubNavSection[]>(DEFAULT_SUBNAV)
  const [subNavCollapsed, setSubNavCollapsed] = useState(false)

  return (
    <AppShellContext.Provider value={{ setSubNavSections }}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <TopBar apps={APP_NAV} maxVisible={7} />
        <div className="flex flex-1 overflow-hidden">
          <SubNav
            sections={subNavSections}
            collapsed={subNavCollapsed}
            onToggle={() => setSubNavCollapsed(c => !c)}
          />
          <main className="flex-1 overflow-auto p-[20px]">
            {children}
          </main>
        </div>
      </div>
      <FusionToaster />
    </AppShellContext.Provider>
  )
}

export function useSubNav(sections: SubNavSection[]) {
  const { setSubNavSections } = React.useContext(AppShellContext)
  React.useEffect(() => {
    setSubNavSections(sections)
    return () => setSubNavSections(DEFAULT_SUBNAV)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
