import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...rest }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[11px] text-[rgba(255,255,255,0.35)]" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]
          rounded-[6px] px-3 py-2 text-[13px] text-[#f8fafc] resize-y min-h-[80px]
          placeholder:text-[rgba(255,255,255,0.2)]
          focus:outline-none focus:border-[rgba(245,158,11,0.4)]
          focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]
          transition-all duration-150
          ${error ? 'border-[rgba(239,68,68,0.5)]' : ''}
          ${className}
        `}
        style={{ fontFamily: 'var(--font-body)' }}
        {...rest}
      />
      {error && <span className="text-[10px] text-[#fca5a5]">{error}</span>}
    </div>
  )
}
