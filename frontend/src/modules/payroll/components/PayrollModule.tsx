import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { usePayrollStore, HrPayslip } from '../stores/payrollStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';
import { CheckCircle, DollarSign } from 'lucide-react';

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-500/20 text-gray-400' },
    verify: { label: 'Waiting', cls: 'bg-blue-500/20 text-blue-400' },
    done: { label: 'Done', cls: 'bg-green-500/20 text-green-400' },
    cancel: { label: 'Cancelled', cls: 'bg-red-500/20 text-red-400' },
};

export const PayrollModule: React.FC = () => {
    const { payslips, fetch, create, update, remove, confirm } = usePayrollStore();
    const { employees, fetchEmployees } = useHRStore();
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrPayslip | null>(null);
    const [formData, setFormData] = useState<Partial<HrPayslip>>({ state: 'draft', basicWage: 0, grossSalary: 0, netSalary: 0, deductions: 0 });

    useEffect(() => { fetch(); fetchEmployees(); }, []);

    const handleNew = () => { setActiveRecord(null); setFormData({ state: 'draft', name: `SLIP/${new Date().getFullYear()}/${String(payslips.length + 1).padStart(3, '0')}`, dateFrom: new Date().toISOString(), dateTo: new Date().toISOString(), basicWage: 0, grossSalary: 0, netSalary: 0, deductions: 0 }); setCurrentView('form'); };
    const handleRowClick = (r: HrPayslip) => { setActiveRecord(r); setFormData(r); setCurrentView('form'); };
    const handleSave = async () => {
        const { employee, createdAt, id, ...rest } = formData as any;
        rest.grossSalary = rest.basicWage || 0;
        rest.netSalary = (rest.basicWage || 0) - (rest.deductions || 0);
        if (activeRecord) await update(activeRecord.id, rest); else await create(rest);
        setCurrentView('list');
    };
    const handleDelete = async () => { if (!activeRecord) return; if (window.confirm('Delete?')) { await remove(activeRecord.id); setCurrentView('list'); } };

    const filtered = payslips.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalNet = payslips.reduce((s, p) => s + (p.netSalary || 0), 0);

    const renderStateBadge = (state: string) => { const s = STATE_LABELS[state] || STATE_LABELS.draft; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${s.cls}`}>{s.label}</span>; };

    const renderList = () => (
        <>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Payslips</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{payslips.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Net Salary</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">${totalNet.toLocaleString()}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Draft</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">{payslips.filter(p => p.state === 'draft').length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Confirmed</p><p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{payslips.filter(p => p.state === 'done').length}</p></div>
            </div>
            <OdooListBase data={filtered} onRowClick={handleRowClick} keyExtractor={t => t.id.toString()} columns={[
                { key: 'name', label: 'Reference', render: t => <span className="font-bold font-mono">{t.name}</span> },
                { key: 'employee', label: 'Employee', render: t => t.employee?.name || '—' },
                { key: 'dateFrom', label: 'Period', render: t => `${new Date(t.dateFrom).toLocaleDateString()} — ${new Date(t.dateTo).toLocaleDateString()}` },
                { key: 'grossSalary', label: 'Gross', render: t => `$${t.grossSalary.toFixed(2)}` },
                { key: 'deductions', label: 'Deductions', render: t => `$${t.deductions.toFixed(2)}` },
                { key: 'netSalary', label: 'Net', render: t => <span className="font-bold text-green-400">${t.netSalary.toFixed(2)}</span> },
                { key: 'state', label: 'Status', render: t => renderStateBadge(t.state) },
            ]} />
        </>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {activeRecord && formData.state === 'draft' && (
                            <button onClick={async () => { await confirm(activeRecord.id); setFormData(p => ({ ...p, state: 'done' })); }} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-green-500/30 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Confirm</button>
                        )}
                        {renderStateBadge(formData.state || 'draft')}
                    </div>
                    {activeRecord && <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button>}
                </div>
            }
            headerContent={<input type="text" className="text-4xl font-bold bg-transparent text-white font-mono border-b border-transparent outline-none focus:border-primary-purple transition-all w-full" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />}
            leftPanels={
                <div className="space-y-6"><div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}><option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Basic Wage</label><input type="number" step={100} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.basicWage || 0} onChange={e => { const v = parseFloat(e.target.value); setFormData({ ...formData, basicWage: v, grossSalary: v, netSalary: v - (formData.deductions || 0) }); }} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Period From</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.dateFrom ? formData.dateFrom.slice(0, 10) : ''} onChange={e => setFormData({ ...formData, dateFrom: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Period To</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.dateTo ? formData.dateTo.slice(0, 10) : ''} onChange={e => setFormData({ ...formData, dateTo: new Date(e.target.value).toISOString() })} /></div>
                    <div className="space-y-2"><label className="text-white/60 text-sm">Deductions</label><input type="number" step={50} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.deductions || 0} onChange={e => { const v = parseFloat(e.target.value); setFormData({ ...formData, deductions: v, netSalary: (formData.basicWage || 0) - v }); }} /></div>
                </div></div>
            }
            rightPanels={
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Salary Breakdown</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Basic Wage</span><span className="text-white font-mono">${(formData.basicWage || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-white/60">Deductions</span><span className="text-red-400 font-mono">-${(formData.deductions || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between pt-1"><span className="text-white font-bold">Net Salary</span><span className="text-green-400 font-bold font-mono text-lg">${((formData.basicWage || 0) - (formData.deductions || 0)).toFixed(2)}</span></div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager title="Payroll" currentView={currentView} onViewChange={setCurrentView} onNew={handleNew} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
