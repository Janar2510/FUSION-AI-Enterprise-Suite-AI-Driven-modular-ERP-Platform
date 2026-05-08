import React from 'react'
import { GlassCard } from './GlassCard'

interface StatCardProps {
  value: string | number
  label: string
  delta?: string
  deltaPositive?: boolean
  highlight?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  value, label, delta, deltaPositive, highlight = false, className = '',
}) => (
  <GlassCard variant={highlight ? 'highlight' : 'default'} className={className}>
    <div
      className={`text-[22px] font-bold ${highlight ? 'text-[#fbbf24]' : 'text-[#f8fafc]'}`}
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {value}
    </div>
    <div className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
      {label}
    </div>
    {delta && (
      <div
        className={`text-[10px] mt-1 ${deltaPositive ? 'text-[#34d399]' : deltaPositive === false ? 'text-[#fca5a5]' : 'text-[#fcd34d]'}`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {delta}
      </div>
    )}
  </GlassCard>
)
