import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Module {
  name: string
  description: string
  icon: LucideIcon
  status: 'active' | 'inactive' | 'loading'
  color: string
}

interface ModuleCardProps {
  module: Module
  onClick?: () => void
  className?: string
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onClick,
  className,
}) => {
  const { name, description, icon: Icon, status, color } = module

  const statusColors = {
    active: 'text-green-400',
    inactive: 'text-gray-400',
    loading: 'text-yellow-400',
  }

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading...',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300',
        color
      )} />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            'p-3 rounded-lg bg-gradient-to-r bg-opacity-20',
            color
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              status === 'active' ? 'bg-green-400' : 
              status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-400'
            )} />
            <span className={cn(
              'text-xs font-medium',
              statusColors[status]
            )}>
              {statusLabels[status]}
            </span>
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-200 transition-colors">
            {name}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Action Button */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
        >
          <span className="text-primary-400 text-sm font-medium group-hover:text-primary-300 transition-colors">
            Open Module
          </span>
          <motion.div
            className="text-primary-400 group-hover:text-primary-300 transition-colors"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.div>
        </motion.div>
      </div>
      
      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}




