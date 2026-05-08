import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const base = `
  inline-flex items-center justify-center gap-2
  font-semibold cursor-pointer select-none
  transition-all duration-150 border
  disabled:opacity-50 disabled:cursor-not-allowed
`

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-br from-[#f59e0b] to-[#f97316]
    text-black border-transparent
    shadow-[0_0_16px_rgba(245,158,11,0.3)]
    hover:shadow-[0_0_24px_rgba(245,158,11,0.5)]
    hover:brightness-110
  `,
  secondary: `
    bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.6)]
    border-[rgba(255,255,255,0.1)]
    hover:bg-[rgba(255,255,255,0.08)] hover:text-white
  `,
  danger: `
    bg-gradient-to-br from-[#ef4444] to-[#dc2626]
    text-white border-transparent
    shadow-[0_0_16px_rgba(239,68,68,0.2)]
    hover:shadow-[0_0_24px_rgba(239,68,68,0.35)]
  `,
  ghost: `
    bg-transparent border-transparent text-[rgba(255,255,255,0.4)]
    hover:bg-[rgba(255,255,255,0.06)] hover:text-white
  `,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[11px] px-3 py-1.5 rounded-[5px]',
  md: 'text-[12px] px-4 py-2 rounded-[7px]',
  lg: 'text-[13px] px-5 py-2.5 rounded-[8px]',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  style,
  ...rest
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--font-heading)', ...style }}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
