import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  blur?: 'sm' | 'md' | 'lg'
  gradient?: boolean
  animated?: boolean
  glow?: boolean
  hover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

// Design System Blur levels
const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
}

// Animation variants following design system
const cardVariants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
  },
  tap: {
    scale: 0.98,
  },
}

// Glow variants with amber/orange design system
const glowVariants = {
  initial: {
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
  },
  hover: {
    boxShadow: '0 12px 40px 0 rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.15)',
  },
}

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  blur = 'md',
  gradient = false,
  animated = true,
  glow = false,
  hover = true,
  onClick,
  style,
}) => {
  const CardComponent = animated ? motion.div : 'div'

  const cardProps = animated
    ? {
        variants: cardVariants,
        initial: "initial",
        whileHover: hover ? "hover" : "initial",
        whileTap: "tap",
        transition: springTransition,
      }
    : {}

  return (
    <CardComponent
      {...cardProps}
      className={cn(
        'glass-card',
        'bg-glass-bg border border-glass-border rounded-xl',
        blurClasses[blur],
        gradient && 'gradient-border',
        glow && 'animate-glow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
    >
      {animated && glow ? (
        <motion.div
          variants={glowVariants}
          initial="initial"
          whileHover="hover"
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </CardComponent>
  )
}

export default GlassCard