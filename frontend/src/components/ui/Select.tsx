import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[11px] text-[rgba(255,255,255,0.35)]" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full appearance-none bg-[rgba(255,255,255,0.03)]
            border border-[rgba(255,255,255,0.07)] rounded-[6px]
            px-3 py-2 pr-8 text-[13px] text-[#f8fafc]
            focus:outline-none focus:border-[rgba(245,158,11,0.4)]
            focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
            transition-all duration-150 cursor-pointer
            ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
            ${className}
          `}
          style={{ fontFamily: 'var(--font-body)' }}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] pointer-events-none" />
      </div>
      {error && <span className="text-[10px] text-[#fca5a5]">{error}</span>}
    </div>
  )
}
