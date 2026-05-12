import React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MotionConflictingSelectProps = 'onAnimationStart' | 'onAnimationEnd'

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, MotionConflictingSelectProps> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

// Animation variants for focus
const selectVariants = {
  focus: {
    scale: 1.01,
    transition: { duration: 0.15 },
  },
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
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
        <motion.select
          id={inputId}
          className={cn(
            "w-full appearance-none",
            "bg-white/[0.03] border border-white/[0.07]",
            "rounded-lg px-4 py-2.5 pr-10",
            "text-sm text-white",
            "focus:outline-none",
            "transition-all duration-150",
            "cursor-pointer",
            "focus:border-primary-500/50",
            "focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]",
            error && "border-red-500/50 focus:border-red-500/50",
            className
          )}
          style={{ fontFamily: 'var(--font-body)' }}
          variants={selectVariants}
          whileFocus="focus"
          {...rest}
        >
          {placeholder && (
            <option value="" disabled className="bg-dark-800">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-dark-800">
              {option.label}
            </option>
          ))}
        </motion.select>

        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
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

export default Select