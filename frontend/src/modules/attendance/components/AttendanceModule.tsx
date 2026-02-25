import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useAttendanceStore, HrAttendance } from '../stores/attendanceStore';
import { useHRStore } from '@/modules/hr/stores/hrStore';

export const AttendanceModule: React.FC = () => {
    const { records, fetch, create, update, remove } = useAttendanceStore();
    const { employees, fetchEmployees } = useHRStore();
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRecord, setActiveRecord] = useState<HrAttendance | null>(null);
    const [formData, setFormData] = useState<Partial<HrAttendance>>({ checkIn: new Date().toISOString(), workedHours: 0 });

    useEffect(() => { fetch(); fetchEmployees(); }, []);

    const handleNew = () => { setActiveRecord(null); setFormData({ checkIn: new Date().toISOString(), workedHours: 0 }); setCurrentView('form'); };
    const handleRowClick = (r: HrAttendance) => { setActiveRecord(r); setFormData(r); setCurrentView('form'); };
    const handleSave = async () => {
        const { employee, createdAt, id, ...rest } = formData as any;
        if (activeRecord) await update(activeRecord.id, rest); else await create(rest);
        setCurrentView('list');
    };
    const handleDelete = async () => { if (!activeRecord) return; if (window.confirm('Delete?')) { await remove(activeRecord.id); setCurrentView('list'); } };

    const filtered = records.filter(r => r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const totalHours = records.reduce((s, r) => s + (r.workedHours || 0), 0);

    const renderList = () => (
        <>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Check-ins</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{records.length}</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Total Hours</p><p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{totalHours.toFixed(1)}h</p></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5"><p className="text-white/50 text-sm mb-1">Currently Checked In</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{records.filter(r => !r.checkOut).length}</p></div>
            </div>
            <OdooListBase data={filtered} onRowClick={handleRowClick} keyExtractor={t => t.id.toString()} columns={[
                { key: 'employee', label: 'Employee', render: t => <span className="font-bold">{t.employee?.name || '—'}</span> },
                { key: 'checkIn', label: 'Check In', render: t => new Date(t.checkIn).toLocaleString() },
                { key: 'checkOut', label: 'Check Out', render: t => t.checkOut ? new Date(t.checkOut).toLocaleString() : <span className="text-green-400 text-xs font-medium">Active</span> },
                { key: 'workedHours', label: 'Worked Hours', render: t => `${t.workedHours.toFixed(1)}h` },
            ]} />
        </>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={activeRecord ? <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Delete</button> : null}
            headerContent={<h2 className="text-3xl font-bold text-white">{activeRecord ? 'Edit Attendance' : 'New Check-in'}</h2>}
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2"><label className="text-white/60 text-sm">Employee</label><select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none appearance-none" value={formData.employeeId || ''} onChange={e => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}><option value="">Select...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Worked Hours</label><input type="number" step={0.5} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.workedHours || 0} onChange={e => setFormData({ ...formData, workedHours: parseFloat(e.target.value) })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Check In</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.checkIn ? formData.checkIn.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, checkIn: new Date(e.target.value).toISOString() })} /></div>
                        <div className="space-y-2"><label className="text-white/60 text-sm">Check Out</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none" value={formData.checkOut ? formData.checkOut.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, checkOut: new Date(e.target.value).toISOString() })} /></div>
                    </div>
                </div>
            }
            rightPanels={null}
        />
    );

    return (
        <OdooViewManager title="Attendances" currentView={currentView} onViewChange={setCurrentView} onNew={handleNew} onSave={handleSave} onDiscard={() => setCurrentView('list')} searchTerm={searchTerm} onSearchChange={setSearchTerm} viewsAvailable={['list', 'form']}>
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
