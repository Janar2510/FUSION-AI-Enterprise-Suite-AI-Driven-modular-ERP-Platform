import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] text-[#34d399]',
  warning: 'bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.3)] text-[#fcd34d]',
  info:    'bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] text-[#a5b4fc]',
  error:   'bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5]',
  neutral: 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)]',
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[variant]} ${className}`}
    style={{ fontFamily: 'var(--font-body)' }}
  >
    {children}
  </span>
)

/** Map common ERP status strings to a badge variant */
export function statusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase()
  if (['won', 'paid', 'done', 'posted', 'confirmed', 'active', 'delivered'].some(v => s.includes(v))) return 'success'
  if (['open', 'warm', 'qualified', 'in_progress', 'draft', 'partial'].some(v => s.includes(v))) return 'warning'
  if (['new', 'cold', 'pending', 'todo'].some(v => s.includes(v))) return 'info'
  if (['lost', 'cancelled', 'error', 'failed', 'overdue'].some(v => s.includes(v))) return 'error'
  return 'neutral'
}
