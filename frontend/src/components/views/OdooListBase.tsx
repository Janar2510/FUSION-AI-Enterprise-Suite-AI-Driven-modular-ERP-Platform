import React from 'react';
import { GlassCard } from '@/components/shared/GlassCard';

export interface Column<T> {
    key: string | keyof T;
    label: string;
    render?: (record: T) => React.ReactNode;
}

interface OdooListBaseProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (record: T) => void;
    keyExtractor: (record: T) => string;
}

export function OdooListBase<T>({ data, columns, onRowClick, keyExtractor }: OdooListBaseProps<T>) {
    return (
        <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="w-12 px-4 py-3">
                                <input type="checkbox" className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                            </th>
                            {columns.map((col, idx) => (
                                <th key={String(col.key) + idx} className="px-6 py-3 text-white/60 text-sm font-medium">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-white/40">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((record, rowIndex) => (
                                <tr
                                    key={keyExtractor(record)}
                                    onClick={() => onRowClick && onRowClick(record)}
                                    className={`border-b border-white/5 hover:bg-white/10 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
                                    </td>
                                    {columns.map((col, colIndex) => (
                                        <td key={String(col.key) + colIndex} className="px-6 py-3 text-white/90">
                                            {col.render ? col.render(record) : String(record[col.key as keyof T] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}
