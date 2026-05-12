import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Design System Types
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

type MotionConflictingButtonProps =
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onDragStart'
  | 'onDrag'
  | 'onDragEnd'

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingButtonProps> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  pulse?: boolean
}

// Animation variants following design system
const buttonVariants = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98 },
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
}

// Design System Styles
const baseStyles = cn(
  "inline-flex items-center justify-center gap-2",
  "font-semibold cursor-pointer select-none",
  "transition-all duration-150 border",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900"
)

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-primary-500 to-secondary-500
    text-black border-transparent
    shadow-[0_0_16px_rgba(245,158,11,0.3)]
    hover:shadow-[0_0_24px_rgba(245,158,11,0.5)]
    hover:brightness-110
  `,
  secondary: `
    bg-glass-bg border-glass-border
    text-white/70 hover:text-white hover:bg-glass-hover hover:border-glass-active
  `,
  danger: `
    bg-gradient-to-br from-red-500 to-red-600
    text-white border-transparent
    shadow-[0_0_16px_rgba(239,68,68,0.2)]
    hover:shadow-[0_0_24px_rgba(239,68,68,0.35)]
  `,
  ghost: `
    bg-transparent border-transparent text-white/40
    hover:bg-white/6 hover:text-white
  `,
  success: `
    bg-gradient-to-br from-green-500 to-green-600
    text-white border-transparent
    shadow-[0_0_16px_rgba(34,197,94,0.2)]
    hover:shadow-[0_0_24px_rgba(34,197,94,0.35)]
  `,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-lg',
  lg: 'text-base px-5 py-2.5 rounded-xl',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  pulse = false,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading

  return (
    <motion.button
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      style={{ fontFamily: 'var(--font-heading)', ...style }}
      variants={buttonVariants}
      initial="initial"
      whileHover={isDisabled ? "initial" : "hover"}
      whileTap={isDisabled ? "initial" : "tap"}
      transition={springTransition}
      animate={pulse ? { scale: [1, 1.02, 1] } : undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : icon}
      {children}
    </motion.button>
  )
}

export default Button