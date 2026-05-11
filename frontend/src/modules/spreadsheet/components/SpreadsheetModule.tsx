import React, { useEffect, useState, useRef } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { useSpreadsheetStore } from '../stores/spreadsheetStore';
import {
    AutoSizer,
    MultiGrid
} from 'react-virtualized';
import {
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Plus,
    Save,
    Settings2,
    Table as TableIcon,
    BarChart3,
    BrainCircuit,
    Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMN_HEADERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROW_COUNT = 1000;
const COL_COUNT = 26;

export const SpreadsheetModule: React.FC = () => {
    const {
        spreadsheets,
        currentSpreadsheet,
        fetchSpreadsheets,
        fetchSpreadsheet,
        createSpreadsheet,
        updateSpreadsheet,
        updateCell,
        evaluateFormula
    } = useSpreadsheetStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null);
    const [formulaValue, setFormulaValue] = useState('');
    const gridRef = useRef<any>(null);

    useEffect(() => {
        fetchSpreadsheets();
    }, []);

    const handleNew = async () => {
        const newDoc = await createSpreadsheet('New Analytical Protocol');
        if (newDoc) {
            setCurrentView('form');
        }
    };

    const handleRowClick = async (id: number) => {
        await fetchSpreadsheet(id);
        setCurrentView('form');
    };

    const handleCellSelect = (row: number, colIndex: number) => {
        const col = COLUMN_HEADERS[colIndex];
        setSelectedCell({ row, col });

        const cell = currentSpreadsheet?.data.rows[row]?.cells[col];
        setFormulaValue(cell?.formula || cell?.value?.toString() || '');
    };

    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormulaValue(e.target.value);
        if (selectedCell) {
            const isFormula = e.target.value.startsWith('=');
            updateCell(selectedCell.row, selectedCell.col, {
                formula: isFormula ? e.target.value : undefined,
                value: isFormula ? evaluateFormula(e.target.value) : e.target.value
            });
            gridRef.current?.forceUpdateGrids();
        }
    };

    const cellRenderer = ({ columnIndex, key, rowIndex, style }: any) => {
        // Headers
        if (rowIndex === 0 && columnIndex === 0) return <div key={key} style={style} className="bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/20">#</div>;
        if (rowIndex === 0) return <div key={key} style={style} className="bg-white/10 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/40 uppercase tracking-widest">{COLUMN_HEADERS[columnIndex - 1]}</div>;
        if (columnIndex === 0) return <div key={key} style={style} className="bg-white/10 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/40">{rowIndex}</div>;

        // Data Cells
        const col = COLUMN_HEADERS[columnIndex - 1];
        const cell = currentSpreadsheet?.data.rows[rowIndex]?.cells[col];
        const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === col;

        return (
            <div
                key={key}
                style={style}
                className={`border border-white/5 px-2 flex items-center text-sm transition-all cursor-cell
                    ${isSelected ? 'bg-primary-500/20 ring-2 ring-primary-500/50 z-10' : 'hover:bg-white/5'}
                `}
                onClick={() => handleCellSelect(rowIndex, columnIndex - 1)}
            >
                <span className={`truncate w-full ${cell?.bold ? 'font-black' : ''} ${cell?.italic ? 'italic' : ''} ${cell?.align === 'right' ? 'text-right' : cell?.align === 'center' ? 'text-center' : 'text-left'}`}>
                    {cell?.value || ''}
                </span>
            </div>
        );
    };

    const renderKanban = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={handleNew}
                className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary-500/40 hover:bg-white/[0.08] transition-all cursor-pointer group shadow-2xl"
            >
                <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-primary-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-white font-black uppercase tracking-[3px] text-xs">Initialize Protocol</h3>
                    <p className="text-white/30 text-[10px] mt-1 font-bold uppercase tracking-widest">Create New Analytical Buffer</p>
                </div>
            </motion.div>

            {spreadsheets.map(s => (
                <motion.div
                    key={s.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => handleRowClick(s.id)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary-500/40 hover:bg-white/[0.08] transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TableIcon className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-wider">{s.name}</h3>
                            <p className="text-white/20 text-[10px] font-mono">ID: {s.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/30 border-t border-white/5 pt-4">
                        <span>Sync: {new Date(s.updatedAt).toLocaleDateString()}</span>
                        <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderForm = () => (
        <div className="flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
                    <button className="p-2 hover:bg-white/10 text-white/60 rounded-md transition-all"><Bold className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-white/10 text-white/60 rounded-md transition-all"><Italic className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/5 ml-2">
                    <button className="p-2 hover:bg-white/10 text-white/60 rounded-md transition-all"><AlignLeft className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-white/10 text-white/60 rounded-md transition-all"><AlignCenter className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-white/10 text-white/60 rounded-md transition-all"><AlignRight className="w-4 h-4" /></button>
                </div>
                <button
                    onClick={() => currentSpreadsheet && updateSpreadsheet(currentSpreadsheet.id, currentSpreadsheet.data)}
                    className="ml-auto flex items-center gap-2 px-6 py-2 bg-primary-500 text-white text-[10px] font-black uppercase tracking-[3px] shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-primary-500/80 transition-all"
                >
                    <Save className="w-3.5 h-3.5" /> Commit Sync
                </button>
            </div>

            {/* Formula Bar */}
            <div className="flex items-center gap-3 p-2 px-4 border-b border-white/10 bg-white/5">
                <div className="w-12 text-[10px] font-black text-white/40 text-center border-r border-white/10 pr-3 flex items-center justify-center gap-2">
                    <Calculator className="w-3 h-3 text-primary-500" /> {selectedCell ? `${selectedCell.col}${selectedCell.row}` : '--'}
                </div>
                <div className="flex-1 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-500 opacity-40 group-focus-within:opacity-100 transition-opacity">fx</div>
                    <input
                        type="text"
                        className="w-full bg-black/40 border border-white/5 px-8 py-2 text-sm text-white font-mono outline-none focus:border-primary-500/40 transition-all tracking-wider"
                        placeholder="Neural analytic function buffer..."
                        value={formulaValue}
                        onChange={handleFormulaChange}
                    />
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 relative overflow-hidden bg-black/20">
                <AutoSizer>
                    {({ height, width }) => (
                        <MultiGrid
                            ref={gridRef}
                            cellRenderer={cellRenderer}
                            columnCount={COL_COUNT + 1}
                            columnWidth={({ index }) => index === 0 ? 40 : 120}
                            fixedColumnCount={1}
                            fixedRowCount={1}
                            height={height}
                            rowCount={ROW_COUNT + 1}
                            rowHeight={({ index }) => index === 0 ? 30 : 35}
                            width={width}
                            className="outline-none"
                            style={{ outline: 'none' }}
                            styleBottomRightGrid={{ outline: 'none' }}
                        />
                    )}
                </AutoSizer>
            </div>

            {/* Status Bar */}
            <div className="p-2 px-4 bg-white/5 border-t border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><BrainCircuit className="w-3 h-3 text-cyan-400" /> Neural engine Active</span>
                    <span className="flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Ready for injection</span>
                </div>
                <span>Sync Node: 0x8F2E...</span>
            </div>
        </div>
    );

    return (
        <OdooViewManager
            title="Neural Intelligence BI"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={() => currentSpreadsheet && updateSpreadsheet(currentSpreadsheet.id, currentSpreadsheet.data)}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'form']}
        >
            <div className="h-full pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {currentView === 'kanban' && renderKanban()}
                        {currentView === 'form' && renderForm()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </OdooViewManager>
    );
};

export default SpreadsheetModule;
