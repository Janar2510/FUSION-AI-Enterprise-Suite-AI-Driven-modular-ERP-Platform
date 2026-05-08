import React, { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => {
  const [visible, setVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-[400] px-2.5 py-1.5 rounded-[5px] text-[11px] text-[#f8fafc] whitespace-nowrap pointer-events-none
            bg-[rgba(13,21,38,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-sm shadow-xl
            ${positions[side]}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
