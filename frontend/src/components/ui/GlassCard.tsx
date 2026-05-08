import React from 'react'

type CardVariant = 'default' | 'highlight' | 'ai'

interface GlassCardProps {
  variant?: CardVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: boolean
}

const variants: Record<CardVariant, string> = {
  default: `
    bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]
    hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]
  `,
  highlight: `
    bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.25)]
    shadow-[0_0_20px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(245,158,11,0.1)]
  `,
  ai: `
    bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]
  `,
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  children,
  className = '',
  onClick,
  padding = true,
}) => (
  <div
    className={`
      rounded-[10px] transition-all duration-150
      ${variants[variant]}
      ${padding ? 'p-[14px]' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
)
