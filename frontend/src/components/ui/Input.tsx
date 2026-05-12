import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

type MotionConflictingInputProps =
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onDragStart'
  | 'onDrag'
  | 'onDragEnd'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, MotionConflictingInputProps> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

// Animation variants for focus
const inputVariants = {
  focus: {
    scale: 1.01,
    transition: { duration: 0.15 },
  },
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-white/50 font-medium"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            {icon}
          </div>
        )}

        <motion.input
          id={inputId}
          className={cn(
            "w-full appearance-none",
            "bg-white/[0.03] border border-white/[0.07]",
            "rounded-lg px-4 py-2.5",
            "text-sm text-white",
            "placeholder:text-white/30",
            "focus:outline-none",
            "transition-all duration-150",
            "focus:border-primary-500/50",
            "focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]",
            error && "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
            icon && "pl-10",
            className
          )}
          style={{ fontFamily: 'var(--font-body)' }}
          variants={inputVariants}
          whileFocus="focus"
          {...rest}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-red-400"
        >
          <AlertCircle size={12} />
          {error}
        </motion.div>
      )}
    </div>
  )
}

export default Input