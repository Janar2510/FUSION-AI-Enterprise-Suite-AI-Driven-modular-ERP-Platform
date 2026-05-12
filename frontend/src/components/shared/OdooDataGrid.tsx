import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

export type ColumnType = 'string' | 'number' | 'boolean' | 'select' | 'date';

export interface ColumnDef<T> {
    key: keyof T | string;
    label: string;
    type?: ColumnType;
    options?: { value: string | number; label: string }[];
    width?: string;
    editable?: boolean;
    /** Custom cell renderer; column is display-only when set */
    cell?: (row: T) => React.ReactNode;
    required?: boolean;
    align?: 'left' | 'center' | 'right';
    format?: (val: any) => string;
}

export interface OdooDataGridProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    onRowChange?: (index: number, updatedRow: T) => void;
    onAddRow?: () => void;
    onDeleteRow?: (index: number) => void;
    readonly?: boolean;
    className?: string;
}

interface CellCoordinates {
    row: number;
    col: number;
}

export function OdooDataGrid<T extends Record<string, any>>({
    columns,
    data,
    onRowChange,
    onAddRow,
    onDeleteRow,
    readonly = false,
    className = '',
}: OdooDataGridProps<T>) {
    const [editingCell, setEditingCell] = useState<CellCoordinates | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Focus input when a cell enters edit mode
    useEffect(() => {
        if (editingCell) {
            if (inputRef.current) {
                inputRef.current.focus();
                if (inputRef.current instanceof HTMLInputElement && inputRef.current.type !== 'checkbox') {
                    inputRef.current.select();
                }
            }
        }
    }, [editingCell]);

    // Click outside to close edit mode
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setEditingCell(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCellClick = (rowIndex: number, colIndex: number, editable: boolean) => {
        if (readonly || !editable) return;
        setEditingCell({ row: rowIndex, col: colIndex });
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        if (readonly) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            // Find next editable cell
            navigateCell(rowIndex, colIndex, e.shiftKey ? -1 : 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Move down one row
            if (rowIndex < data.length - 1) {
                setEditingCell({ row: rowIndex + 1, col: colIndex });
            } else if (onAddRow) {
                onAddRow();
                setTimeout(() => setEditingCell({ row: rowIndex + 1, col: colIndex }), 50);
            } else {
                setEditingCell(null);
            }
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const navigateCell = (row: number, col: number, direction: 1 | -1) => {
        let nextRow = row;
        let nextCol = col + direction;

        while (nextRow >= 0 && nextRow < data.length) {
            while (nextCol >= 0 && nextCol < columns.length) {
                const cnav = columns[nextCol];
                if (!cnav.cell && cnav.editable !== false) {
                    setEditingCell({ row: nextRow, col: nextCol });
                    return;
                }
                nextCol += direction;
            }
            nextRow += direction;
            nextCol = direction === 1 ? 0 : columns.length - 1;
        }

        // If reached the end, try to add a new row
        if (direction === 1 && nextRow >= data.length && onAddRow) {
            onAddRow();
            // Wait for the new row to render
            setTimeout(() => {
                let firstEditableCol = 0;
                while (
                    firstEditableCol < columns.length &&
                    (columns[firstEditableCol].cell || columns[firstEditableCol].editable === false)
                ) {
                    firstEditableCol++;
                }
                if (firstEditableCol < columns.length) {
                    setEditingCell({ row: data.length, col: firstEditableCol });
                }
            }, 50);
            return;
        }

        setEditingCell(null);
    };

    const handleChange = (val: any) => {
        if (!editingCell || !onRowChange) return;
        const { row, col } = editingCell;
        const key = columns[col].key as keyof T;
        const updatedRow = { ...data[row], [key]: val };
        onRowChange(row, updatedRow);
    };

    return (
        <div ref={containerRef} className={`w-full overflow-x-auto ${className}`}>
            <table className="w-full text-left border-collapse min-w-max">
                <thead>
                    <tr className="border-b border-white/10">
                        {columns.map((col, idx) => (
                            <th
                                key={String(col.key)}
                                className={`py-2 px-3 text-sm font-semibold text-white/60 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                style={{ width: col.width }}
                            >
                                {col.label} {col.required && <span className="text-red-400">*</span>}
                            </th>
                        ))}
                        {onDeleteRow && !readonly && <th className="py-2 px-3 w-10"></th>}
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (onDeleteRow ? 1 : 0)} className="py-8 text-center text-white/40">
                                No records found.
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                {columns.map((col, colIndex) => {
                                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                                    const value = row[col.key as keyof T] as any;
                                    const isEditable = !col.cell && col.editable !== false && !readonly;

                                    return (
                                        <td
                                            key={colIndex}
                                            className={`py-2 px-4 shadow-sm ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${isEditable ? 'cursor-text' : 'cursor-default text-white/60'}`}
                                            onClick={() => handleCellClick(rowIndex, colIndex, isEditable)}
                                        >
                                            {isEditing ? (
                                                col.type === 'select' ? (
                                                    <select
                                                        ref={inputRef as any}
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                                        value={value || ''}
                                                        onChange={(e) => handleChange(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                        onBlur={() => setEditingCell(null)}
                                                    >
                                                        <option value="" disabled className="text-black">Select...</option>
                                                        {col.options?.map((opt) => (
                                                            <option key={opt.value} value={opt.value} className="text-black">
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : col.type === 'boolean' ? (
                                                    <input
                                                        ref={inputRef as any}
                                                        type="checkbox"
                                                        className="bg-white/10 border border-white/20 rounded text-blue-500 focus:ring-blue-500"
                                                        checked={!!value}
                                                        onChange={(e) => handleChange(e.target.checked)}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                        onBlur={() => setEditingCell(null)}
                                                    />
                                                ) : col.type === 'date' ? (
                                                    <input
                                                        ref={inputRef as any}
                                                        type="date"
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                                                        onChange={(e) => handleChange(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                        onBlur={() => setEditingCell(null)}
                                                    />
                                                ) : (
                                                    <input
                                                        ref={inputRef as any}
                                                        type={col.type === 'number' ? 'number' : 'text'}
                                                        className={`w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 ${col.align === 'right' ? 'text-right' : ''}`}
                                                        value={value ?? ''}
                                                        onChange={(e) => handleChange(col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                        onBlur={() => setEditingCell(null)}
                                                    />
                                                )
                                            ) : (
                                                <div className="min-h-[24px] flex items-center">
                                                    {col.cell ? (
                                                        col.cell(row)
                                                    ) : col.format ? (
                                                        col.format(value)
                                                    ) : col.type === 'boolean' ? (
                                                            value ? 'Yes' : 'No'
                                                        ) : col.type === 'select' ? (
                                                            col.options?.find(o => o.value === value)?.label || value
                                                        ) : col.type === 'date' && value ? (
                                                            new Date(value).toLocaleDateString()
                                                        ) : (
                                                            value?.toString() || ''
                                                        )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                {onDeleteRow && !readonly && (
                                    <td className="py-1 px-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRow(rowIndex); }}
                                            className="p-1 text-white/40 hover:text-red-400 hover:bg-white/10 rounded"
                                            title="Delete row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
                {onAddRow && !readonly && (
                    <tfoot>
                        <tr>
                            <td colSpan={columns.length + (onDeleteRow ? 1 : 0)} className="pt-2">
                                <button
                                    onClick={onAddRow}
                                    className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add a line
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
