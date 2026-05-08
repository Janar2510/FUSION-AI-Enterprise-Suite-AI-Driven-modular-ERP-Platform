import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className={`relative w-full ${sizes[size]} bg-[#0d1526] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#f8fafc]" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1.5 !px-1.5">
            <X size={16} />
          </Button>
        </div>
        {/* Body */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[rgba(255,255,255,0.06)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
