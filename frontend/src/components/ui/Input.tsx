import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] text-[rgba(255,255,255,0.35)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]
            rounded-[6px] px-3 py-2 text-[13px] text-[#f8fafc]
            placeholder:text-[rgba(255,255,255,0.2)]
            focus:outline-none focus:border-[rgba(245,158,11,0.4)]
            focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
            transition-all duration-150
            ${icon ? 'pl-9' : ''}
            ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
            ${className}
          `}
          style={{ fontFamily: 'var(--font-body)' }}
          {...rest}
        />
      </div>
      {error && (
        <span className="text-[10px] text-[#fca5a5]" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
