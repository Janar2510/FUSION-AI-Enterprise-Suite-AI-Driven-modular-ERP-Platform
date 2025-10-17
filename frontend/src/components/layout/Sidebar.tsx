import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
  MessageSquare,
  BarChart3,
  User,
  Building,
  Bot,
  Headphones,
  CreditCard,
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
  Brush
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'AI Chat', href: '/ai-chat', icon: Bot },
  { name: 'CRM', href: '/module/crm', icon: Users },
  { name: 'Accounting', href: '/module/accounting', icon: DollarSign },
  { name: 'Inventory', href: '/module/inventory', icon: Package },
  { name: 'Sales', href: '/module/sales', icon: ShoppingCart },
  { name: 'Projects', href: '/module/project', icon: Calendar },
  { name: 'Documents', href: '/module/documents', icon: FileText },
  { name: 'HR', href: '/module/hr', icon: User },
  { name: 'Marketing', href: '/module/marketing', icon: BarChart3 },
  { name: 'Manufacturing', href: '/module/manufacturing', icon: Building },
  // Newly exposed modules
  { name: 'Helpdesk', href: '/module/helpdesk', icon: Headphones },
  { name: 'Subscriptions', href: '/module/subscriptions', icon: BadgeDollarSign || CreditCard },
  { name: 'POS', href: '/module/pos', icon: MonitorSmartphone },
  { name: 'Rental', href: '/module/rental', icon: Key },
  { name: 'Timesheets', href: '/module/timesheets', icon: Timer },
  { name: 'Planning', href: '/module/planning', icon: CalendarRange },
  { name: 'Field Service', href: '/module/field-service', icon: Wrench },
  { name: 'Knowledge', href: '/module/knowledge', icon: BookOpen },
  { name: 'Website', href: '/module/website', icon: Globe },
  { name: 'Email Marketing', href: '/module/email-marketing', icon: Mail },
  { name: 'Social Marketing', href: '/module/social-marketing', icon: Share2 },
  { name: 'Studio', href: '/module/studio', icon: Brush },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

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
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {bottomNavigation.map((item, index) => {
          const isActive = location.pathname === item.href
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (navigation.length + index) * 0.1 }}
            >
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Collapse Button */}
      <div className="p-4">
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
