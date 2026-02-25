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
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  }

  const cardVariants = {
    initial: { 
      scale: 1,
      y: 0,
    },
    hover: { 
      scale: hover ? 1.02 : 1,
      y: hover ? -4 : 0,
    },
    tap: { 
      scale: 0.98,
    },
  }

  const glowVariants = {
    initial: { 
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    hover: { 
      boxShadow: glow 
        ? '0 12px 40px 0 rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.2)'
        : '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
    },
  }

  const CardComponent = animated ? motion.div : 'div'
  const cardProps = animated ? {
    variants: cardVariants,
    initial: "initial",
    whileHover: "hover",
    whileTap: "tap",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  } : {}

  return (
    <CardComponent
      {...cardProps}
      className={cn(
        'glass-card',
        blurClasses[blur],
        gradient && 'gradient-border',
        glow && 'animate-glow',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
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




