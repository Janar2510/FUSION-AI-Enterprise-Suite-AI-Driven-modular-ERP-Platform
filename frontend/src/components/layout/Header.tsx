import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Search, User, LogOut } from 'lucide-react'
import { GradientButton } from '@/components/shared/GradientButton'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dark-800/50 backdrop-blur-md border-b border-white/10 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search modules, data, or ask AI..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5 text-white/70" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </motion.button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">{user?.name || 'Guest'}</div>
                <div className="text-white/50 text-xs">{user?.role || 'User'}</div>
              </div>
            </div>

            <GradientButton
              variant="ghost"
              size="sm"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </GradientButton>
          </div>
        </div>
      </div>
    </motion.header>
  )
}




