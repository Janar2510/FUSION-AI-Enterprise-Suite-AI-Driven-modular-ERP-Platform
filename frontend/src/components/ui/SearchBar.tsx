import React from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onOpen?: () => void
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({ onOpen, className = '' }) => (
  <button
    onClick={onOpen}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-[6px] w-[180px]
      bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]
      text-[rgba(255,255,255,0.25)] text-[11px] cursor-pointer
      hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]
      transition-all duration-150
      ${className}
    `}
    style={{ fontFamily: 'var(--font-body)' }}
  >
    <Search size={13} />
    <span>Search...</span>
    <span className="ml-auto text-[10px] opacity-50">⌘K</span>
  </button>
)
