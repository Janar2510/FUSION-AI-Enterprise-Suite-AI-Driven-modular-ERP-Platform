import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export interface SubNavSection {
  title: string
  items: SubNavItem[]
}

export interface SubNavItem {
  key: string
  label: string
  path: string
  badge?: number | string
  icon?: React.ReactNode
}

interface SubNavProps {
  sections: SubNavSection[]
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export const SubNav: React.FC<SubNavProps> = ({ sections, collapsed = false, onToggle, className = '' }) => {
  const navigate = useNavigate()
  const location = useLocation()

  if (collapsed) {
    return (
      <div className="w-[28px] border-r border-[rgba(255,255,255,0.05)] flex flex-col items-center pt-3 flex-shrink-0">
        <button
          onClick={onToggle}
          className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors rotate-180"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    )
  }

  return (
    <nav
      className={`w-[180px] flex-shrink-0 border-r border-[rgba(255,255,255,0.05)] flex flex-col gap-0.5 py-3 px-2 overflow-y-auto ${className}`}
      style={{ background: 'rgba(255,255,255,0.015)' }}
    >
      {sections.map(section => (
        <div key={section.title} className="mb-2">
          <div
            className="px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.8px] text-[rgba(255,255,255,0.2)] mb-0.5"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {section.title}
          </div>
          {section.items.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-2 px-2.5 py-[7px] rounded-[6px]
                  text-[12px] transition-all duration-150 text-left
                  ${isActive
                    ? 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#fcd34d] font-medium'
                    : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'}
                `}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                    boxShadow: isActive ? '0 0 5px rgba(245,158,11,0.5)' : undefined,
                  }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-[8px]"
                    style={{
                      background: 'rgba(245,158,11,0.2)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#fbbf24',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      {onToggle && (
        <button
          onClick={onToggle}
          className="mt-auto mx-2 py-2 text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)] flex items-center gap-1.5 text-[10px] transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ChevronLeft size={12} />
          Collapse
        </button>
      )}
    </nav>
  )
}
