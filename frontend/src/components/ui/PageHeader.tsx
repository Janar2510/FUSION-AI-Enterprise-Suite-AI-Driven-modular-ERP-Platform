import React from 'react'

interface PageHeaderProps {
  title: string
  meta?: string
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, meta, actions, className = '' }) => (
  <div className={`flex items-start justify-between ${className}`}>
    <div>
      <h1
        className="text-[20px] font-bold text-[#f8fafc] tracking-[-0.3px]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h1>
      {meta && (
        <p className="text-[12px] text-[rgba(255,255,255,0.3)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
          {meta}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
)
