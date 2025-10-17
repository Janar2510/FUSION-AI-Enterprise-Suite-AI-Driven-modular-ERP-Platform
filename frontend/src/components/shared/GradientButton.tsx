import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  ripple?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  pulse = false,
  ripple = false,
  disabled = false,
  loading = false,
  className,
  onClick,
  type = 'button',
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-lg shadow-primary-500/25',
    secondary: 'bg-glass-bg backdrop-blur-md border border-glass-border hover:bg-glass-hover hover:border-glass-active text-white',
    ghost: 'text-white/70 hover:text-white hover:bg-glass-hover',
  }

  const buttonVariants = {
    initial: { 
      scale: 1,
      y: 0,
    },
    hover: { 
      scale: disabled ? 1 : 1.05,
      y: disabled ? 0 : -2,
    },
    tap: { 
      scale: disabled ? 1 : 0.95,
    },
  }

  const pulseVariants = {
    initial: { 
      scale: 1,
    },
    pulse: { 
      scale: [1, 1.05, 1],
    },
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled ? "initial" : "hover"}
      whileTap={disabled ? "initial" : "tap"}
      animate={pulse ? "pulse" : "initial"}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        ...(pulse && {
          repeat: Infinity,
          duration: 2,
        }),
      }}
      className={cn(
        'relative font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
    >
      {/* Ripple effect */}
      {ripple && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-white/20"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ 
            scale: 1, 
            opacity: [0, 0.3, 0],
            transition: { duration: 0.6 }
          }}
        />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
      
      {/* Button content */}
      <motion.span
        className={cn(
          'relative z-10 flex items-center justify-center gap-2',
          loading && 'opacity-0'
        )}
      >
        {children}
      </motion.span>
    </motion.button>
  )
}




