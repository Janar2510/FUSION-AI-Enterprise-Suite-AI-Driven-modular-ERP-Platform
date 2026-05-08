import React from 'react'
import { Button } from './Button'

interface AIAction {
  label: string
  onClick: () => void
}

interface AIPanelProps {
  insight: string
  actions?: AIAction[]
  loading?: boolean
  className?: string
}

export const AIPanel: React.FC<AIPanelProps> = ({ insight, actions = [], loading = false, className = '' }) => (
  <div
    className={`
      bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]
      rounded-[8px] p-3 ${className}
    `}
  >
    <div className="flex items-center gap-2 mb-2">
      <span
        className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0"
        style={{ boxShadow: '0 0 8px rgba(245,158,11,0.8)', animation: 'pulse 2s infinite' }}
      />
      <span className="text-[10px] font-semibold text-[#fcd34d]" style={{ fontFamily: 'var(--font-heading)' }}>
        Claude AI
      </span>
    </div>
    {loading ? (
      <div className="h-4 bg-[rgba(245,158,11,0.1)] rounded animate-pulse" />
    ) : (
      <p className="text-[10px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-2.5" style={{ fontFamily: 'var(--font-body)' }}>
        {insight}
      </p>
    )}
    {actions.map((a, i) => (
      <Button key={i} variant="primary" size="sm" className="w-full mb-1.5 text-[10px]" onClick={a.onClick}>
        {a.label}
      </Button>
    ))}
  </div>
)
