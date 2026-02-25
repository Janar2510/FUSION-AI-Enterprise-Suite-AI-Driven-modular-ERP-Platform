import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  Calendar,
  Settings,
  HelpCircle,
  BarChart3,
  User,
  Building,
  Bot,
  Headphones,
  BadgeDollarSign,
  MonitorSmartphone,
  Key,
  Timer,
  CalendarRange,
  Wrench,
  BookOpen,
  Globe,
  Mail,
  Share2,
  Brush,
  CalendarOff,
  Wallet,
  Car,
  HardDrive,
  ClipboardCheck,
  StickyNote,
  CalendarDays,
  Ticket,
  UserPlus,
  Clock4,
  Landmark,
  Award,
  ShieldCheck,
  GitPullRequest,
  Truck,
  ChevronDown,
  MessageSquare,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'AI Chat', href: '/ai-chat', icon: Bot },
      { name: 'CRM', href: '/module/crm', icon: Users },
      { name: 'Sales', href: '/module/sales', icon: ShoppingCart },
      { name: 'Purchase', href: '/module/purchases', icon: Truck },
      { name: 'Inventory', href: '/module/inventory', icon: Package },
      { name: 'Supply Chain', href: '/module/supply_chain', icon: GitPullRequest },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Accounting', href: '/module/accounting', icon: DollarSign },
      { name: 'Subscriptions', href: '/module/subscriptions', icon: BadgeDollarSign },
      { name: 'Expenses', href: '/module/expenses', icon: Wallet },
      { name: 'Payroll', href: '/module/payroll', icon: Landmark },
    ],
  },
  {
    label: 'HR',
    items: [
      { name: 'Employees', href: '/module/hr', icon: User },
      { name: 'Recruitment', href: '/module/recruitment', icon: UserPlus },
      { name: 'Time Off', href: '/module/leaves', icon: CalendarOff },
      { name: 'Attendances', href: '/module/attendance', icon: Clock4 },
      { name: 'Appraisals', href: '/module/appraisals', icon: Award },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Manufacturing', href: '/module/manufacturing', icon: Building },
      { name: 'Quality', href: '/module/quality', icon: ShieldCheck },
      { name: 'PLM', href: '/module/plm', icon: GitPullRequest },
      { name: 'Field Service', href: '/module/field_service', icon: Wrench },
      { name: 'Maintenance', href: '/module/maintenance', icon: HardDrive },
      { name: 'Fleet', href: '/module/fleet', icon: Car },
      { name: 'POS', href: '/module/pos', icon: MonitorSmartphone },
      { name: 'Rental', href: '/module/rental', icon: Key },
    ],
  },
  {
    label: 'Projects',
    items: [
      { name: 'Projects', href: '/module/project', icon: Calendar },
      { name: 'Timesheets', href: '/module/timesheets', icon: Timer },
      { name: 'Planning', href: '/module/planning', icon: CalendarRange },
      { name: 'Helpdesk', href: '/module/helpdesk', icon: Headphones },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { name: 'Marketing', href: '/module/marketing', icon: BarChart3 },
      { name: 'Email', href: '/module/email_marketing', icon: Mail },
      { name: 'Social', href: '/module/social_marketing', icon: Share2 },
      { name: 'Events', href: '/module/events', icon: Ticket },
      { name: 'Website', href: '/module/website', icon: Globe },
      { name: 'eCommerce', href: '/module/ecommerce', icon: Store },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { name: 'Calendar', href: '/module/calendar', icon: CalendarDays },
      { name: 'Documents', href: '/module/documents', icon: FileText },
      { name: 'Notes', href: '/module/notes', icon: StickyNote },
      { name: 'Knowledge', href: '/module/knowledge', icon: BookOpen },
      { name: 'Surveys', href: '/module/surveys', icon: ClipboardCheck },
      { name: 'Discuss', href: '/module/discuss', icon: MessageSquare },
    ],
  },
  {
    label: 'Config',
    items: [
      { name: 'Studio', href: '/module/studio', icon: Brush },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
]

const STORAGE_KEY = 'fusionai-sidebar-collapsed-sections'

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  // Load collapsed sections from localStorage
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedSections))
  }, [collapsedSections])

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isSectionActive = (section: NavSection) =>
    section.items.some(item => location.pathname === item.href)

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col bg-dark-800/50 backdrop-blur-md border-r border-white/10 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-xl font-bold text-white">FusionAI</h1>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-3 space-y-1">
        {sections.map((section, sIdx) => {
          const sectionCollapsed = collapsedSections[section.label] ?? false
          const hasActiveItem = isSectionActive(section)

          return (
            <div key={section.label}>
              {/* Section Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors mb-0.5',
                    hasActiveItem ? 'text-primary-400' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {section.label}
                  <motion.div
                    animate={{ rotate: sectionCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                </button>
              )}

              {/* Section separator when collapsed */}
              {isCollapsed && sIdx > 0 && (
                <div className="border-t border-white/5 my-1" />
              )}

              {/* Items */}
              <AnimatePresence initial={false}>
                {(!sectionCollapsed || isCollapsed) && (
                  <motion.div
                    key={`section-${section.label}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 group text-sm',
                            isActive
                              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="font-medium truncate">{item.name}</span>
                          )}
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </motion.div>
        </motion.button>
      </div>
    </motion.aside>
  )
}
