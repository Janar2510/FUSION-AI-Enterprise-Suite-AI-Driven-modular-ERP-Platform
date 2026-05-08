import React from 'react'

export interface Tab {
  key: string
  label: string
  count?: number
}

type TabBarVariant = 'underline' | 'pill'

interface TabBarProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
  variant?: TabBarVariant
  className?: string
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeKey, onChange, variant = 'underline', className = '' }) => {
  if (variant === 'pill') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              px-3 py-1.5 rounded-[6px] text-[11px] font-medium transition-all duration-150
              ${activeKey === tab.key
                ? 'bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] text-[#fcd34d]'
                : 'text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'}
            `}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[9px] opacity-60">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`flex gap-0 border-b border-[rgba(255,255,255,0.06)] ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150
            border-b-2 mb-[-1px]
            ${activeKey === tab.key
              ? 'text-[#fbbf24] border-b-[#f59e0b]'
              : 'text-[rgba(255,255,255,0.35)] border-b-transparent hover:text-[rgba(255,255,255,0.6)]'}
          `}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[9px] opacity-60">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
