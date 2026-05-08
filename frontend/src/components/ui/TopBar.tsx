import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown } from 'lucide-react'
import { Avatar } from './Avatar'
import { SearchBar } from './SearchBar'

export interface AppNavItem {
  key: string
  label: string
  path: string
}

interface TopBarProps {
  apps: AppNavItem[]
  userName?: string
  notificationCount?: number
  onSearchOpen?: () => void
  maxVisible?: number
}

export const TopBar: React.FC<TopBarProps> = ({
  apps,
  userName = 'Admin',
  notificationCount = 0,
  onSearchOpen,
  maxVisible = 7,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [overflowOpen, setOverflowOpen] = useState(false)

  const visible = apps.slice(0, maxVisible)
  const overflow = apps.slice(maxVisible)
  const activeApp = apps.find(a => location.pathname.startsWith(a.path))

  return (
    <header
      className="h-[44px] flex items-center px-4 gap-1 sticky top-0 z-[200] border-b border-[rgba(255,255,255,0.06)]"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 mr-3 cursor-pointer flex-shrink-0"
        onClick={() => navigate('/')}
      >
        <div
          className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            boxShadow: '0 0 14px rgba(245,158,11,0.4)',
          }}
        />
        <span className="text-[15px] font-bold text-[#fafafa]" style={{ fontFamily: 'var(--font-heading)' }}>
          FusionAI
        </span>
      </div>

      {/* App pills */}
      {visible.map(app => (
        <button
          key={app.key}
          onClick={() => navigate(app.path)}
          className={`
            px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all duration-150 flex-shrink-0
            ${activeApp?.key === app.key
              ? 'bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#fcd34d]'
              : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] border border-transparent'}
          `}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {app.label}
        </button>
      ))}

      {/* Overflow */}
      {overflow.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOverflowOpen(o => !o)}
            className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-[rgba(255,255,255,0.4)] hover:text-white flex items-center gap-1 border border-transparent"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ··· <ChevronDown size={12} />
          </button>
          {overflowOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#0d1526] border border-[rgba(255,255,255,0.1)] rounded-[8px] shadow-2xl z-[300] py-1">
              {overflow.map(app => (
                <button
                  key={app.key}
                  onClick={() => { navigate(app.path); setOverflowOpen(false) }}
                  className="w-full text-left px-3.5 py-2 text-[12px] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right */}
      <div className="ml-auto flex items-center gap-2.5">
        <SearchBar onOpen={onSearchOpen} />
        <div className="relative">
          <button className="w-[28px] h-[28px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[6px] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
            <Bell size={14} />
          </button>
          {notificationCount > 0 && (
            <span
              className="absolute top-[5px] right-[5px] w-[6px] h-[6px] rounded-full bg-[#f59e0b]"
              style={{ boxShadow: '0 0 4px rgba(245,158,11,0.8)' }}
            />
          )}
        </div>
        <Avatar name={userName} size={28} glow />
      </div>
    </header>
  )
}
