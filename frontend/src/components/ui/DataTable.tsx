import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  activeRowId?: string | number
  onRowClick?: (row: T) => void
  className?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns, rows, activeRowId, onRowClick, className = '', emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = String(a[sortKey] ?? '')
        const bv = String(b[sortKey] ?? '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    : rows

  return (
    <div className={`bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-[10px] overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="grid border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.025)]"
        style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}
      >
        {columns.map(col => (
          <div
            key={String(col.key)}
            className={`px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[rgba(255,255,255,0.25)] flex items-center gap-1 ${col.sortable ? 'cursor-pointer hover:text-[#fbbf24] select-none' : ''}`}
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={() => col.sortable && handleSort(String(col.key))}
          >
            {col.header}
            {col.sortable && sortKey === String(col.key) && (
              sortDir === 'asc' ? <ChevronUp size={10} className="text-[#fbbf24]" /> : <ChevronDown size={10} className="text-[#fbbf24]" />
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="px-3.5 py-6 text-[12px] text-[rgba(255,255,255,0.3)] text-center" style={{ fontFamily: 'var(--font-body)' }}>
          {emptyMessage}
        </div>
      ) : (
        sorted.map((row, i) => {
          const rowId = (row.id as string | number) ?? i
          const isActive = activeRowId !== undefined && rowId === activeRowId
          return (
            <div
              key={rowId}
              className={`
                grid border-b border-[rgba(255,255,255,0.04)] last:border-0 items-center
                transition-colors duration-100
                ${isActive ? 'bg-[rgba(245,158,11,0.04)] border-l-2 border-l-[rgba(245,158,11,0.3)]' : ''}
                ${onRowClick ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.025)]' : ''}
              `}
              style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <div key={String(col.key)} className="px-3.5 py-2.5 text-[12px] text-[rgba(255,255,255,0.6)]" style={{ fontFamily: 'var(--font-body)' }}>
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
