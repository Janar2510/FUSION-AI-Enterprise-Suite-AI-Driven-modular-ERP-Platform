import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useHRStore, HrEmployee, HrDepartment } from '../stores/hrStore';
import { useLeavesStore } from '@/modules/leaves/stores/leavesStore';
import { usePayrollStore } from '@/modules/payroll/stores/payrollStore';
import { useAttendanceStore } from '@/modules/attendance/stores/attendanceStore';
import { CalendarOff, Landmark, Clock4, Phone, Mail, Building, Briefcase, MapPin } from 'lucide-react';
import { HierarchyView, HierarchyNode } from '@/components/views/HierarchyView';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { AiActionsPanel } from '@/components/shared/AiActionsPanel';

export const HRModule: React.FC = () => {
    const navigate = useNavigate();
    const {
        employees,
        departments,
        jobs,
        fetchEmployees,
        fetchDepartments,
        fetchJobs,
        createEmployee,
        updateEmployee,
        createDepartment
    } = useHRStore();

    // Cross-module stores
    const { leaves, fetchLeaves } = useLeavesStore();
    const { payslips, fetch: fetchPayslips } = usePayrollStore();
    const { records: attendanceRecords, fetch: fetchAttendance } = useAttendanceStore();

    const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');
    const [currentView, setCurrentView] = useState<ViewType>('kanban'); // Default to Kanban 
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [activeRecord, setActiveRecord] = useState<HrEmployee | HrDepartment | null>(null);
    const [employeeFormData, setEmployeeFormData] = useState<Partial<HrEmployee>>({});
    const [departmentFormData, setDepartmentFormData] = useState<Partial<HrDepartment>>({});

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchJobs();
        fetchLeaves();
        fetchPayslips();
        fetchAttendance();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        if (activeTab === 'employees') {
            setEmployeeFormData({
                active: true,
            });
        } else {
            setDepartmentFormData({
                active: true,
            });
        }
        setCurrentView('form');
    };

    const handleRowClick = (record: any) => {
        setActiveRecord(record);
        if (activeTab === 'employees') {
            setEmployeeFormData(record);
        } else {
            setDepartmentFormData(record);
        }
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeTab === 'employees') {
            if (activeRecord) {
                await updateEmployee(activeRecord.id, employeeFormData);
            } else {
                const newEmp = await createEmployee(employeeFormData);
                if (newEmp) setActiveRecord(newEmp);
            }
        } else {
            if (activeRecord) {
                // Edit depart logic not implemented in store yet, skip for now or add
                // await updateDepartment(activeRecord.id, departmentFormData);
            } else {
                const newDept = await createDepartment(departmentFormData);
                if (newDept) setActiveRecord(newDept);
            }
        }
        setCurrentView('kanban');
    };

    // --------------------------------------------------------------------------
    // EMPLOYEES VIEW
    // --------------------------------------------------------------------------
    const renderEmployeesKanban = () => {
        const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.workEmail?.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {filteredEmployees.map(emp => (
                    <div
                        key={emp.id}
                        onClick={() => handleRowClick(emp)}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/10 hover:border-primary-purple/50 transition-all flex item-center gap-4 group shadow-sm backdrop-blur-md"
                    >
                        {/* Avatar Placeholder */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-purple/40 to-indigo-500/40 border border-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-inner">
                            {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>

                        <div className="flex flex-col justify-center flex-1 overflow-hidden">
                            <h3 className="text-md font-bold text-white truncate group-hover:text-primary-purple transition-colors">{emp.name}</h3>
                            <p className="text-xs text-white/50 truncate mb-2">{emp.job?.name || emp.jobId || 'No Job Position'}</p>

                            <div className="space-y-1 mt-auto">
                                {emp.workEmail && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/70 truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0 text-white/40" />
                                        <span className="truncate">{emp.workEmail}</span>
                                    </div>
                                )}
                                {emp.workPhone && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                                        <Phone className="w-3 h-3 flex-shrink-0 text-white/40" />
                                        <span>{emp.workPhone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const renderEmployeesList = () => (
        <OdooListBase
            data={employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.workEmail?.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(e) => e.id.toString()}
            columns={[
                { key: 'name', label: 'Name', render: (e) => <span className="font-bold">{e.name}</span> },
                { key: 'workEmail', label: 'Work Email', render: (e) => e.workEmail || '' },
                { key: 'workPhone', label: 'Work Phone', render: (e) => e.workPhone || '' },
                { key: 'department', label: 'Department', render: (e) => e.department?.name || '' },
                { key: 'job', label: 'Job Position', render: (e) => e.job?.name || '' },
                { key: 'manager', label: 'Manager', render: (e) => e.manager?.name || '' },
            ]}
        />
    );

    const renderEmployeeForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {/* Action buttons could go here */}
                    </div>
                    <div className="flex text-sm font-medium">
                        <div className={`px-4 py-2 flex items-center pr-6 uppercase text-primary-purple font-bold`}>
                            {employeeFormData.active ? 'Active' : 'Archived'}
                        </div>
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Employee's Name"
                        value={employeeFormData.name || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    />
                    <h3 className="text-xl text-white/50">{employeeFormData.job?.name || ''}</h3>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Work Mobile</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.workPhone || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, workPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Work Email</label>
                            <input
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.workEmail || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, workEmail: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Department</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.departmentId || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, departmentId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select Department...</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Job Position</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.jobId || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, jobId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select Job Position...</option>
                                {jobs.map(j => (
                                    <option key={j.id} value={j.id} className="text-black">{j.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Manager</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.managerId || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, managerId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select Manager...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id} className="text-black">{e.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Coach</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={employeeFormData.coachId || ''}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, coachId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select Coach...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id} className="text-black">{e.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                activeRecord ? (() => {
                    const empId = activeRecord.id;
                    const empLeaves = leaves.filter(l => l.employeeId === empId);
                    const empPayslips = payslips.filter((p: any) => p.employeeId === empId);
                    const empAttendance = attendanceRecords.filter(a => a.employeeId === empId);
                    const approvedLeaves = empLeaves.filter(l => l.state === 'validate');
                    const totalLeaveDays = approvedLeaves.reduce((s, l) => s + l.numberOfDays, 0);

                    return (
                        <div className="space-y-4">
                            {/* HR Smart Buttons Odoo Parity */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Time Off Smart Button */}
                                <button
                                    onClick={() => navigate('/module/leaves')}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/50"></div>
                                    <CalendarOff className="w-5 h-5 text-amber-400 mb-1" />
                                    <span className="text-2xl font-bold text-white leading-none">{totalLeaveDays}</span>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wide">Time Off</span>
                                </button>

                                {/* Attendance Smart Button */}
                                <button
                                    onClick={() => navigate('/module/attendance')}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400/50"></div>
                                    <Clock4 className="w-5 h-5 text-indigo-400 mb-1" />
                                    <span className="text-2xl font-bold text-white leading-none">{empAttendance.length}</span>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wide">Attendances</span>
                                </button>

                                {/* Contracts Smart Button */}
                                <button
                                    onClick={() => navigate('/module/payroll')}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400/50"></div>
                                    <Landmark className="w-5 h-5 text-green-400 mb-1" />
                                    <span className="text-2xl font-bold text-white leading-none">1</span>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wide">Contracts</span>
                                </button>

                                {/* Payslips Smart Button */}
                                <button
                                    onClick={() => navigate('/module/payroll')}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/50"></div>
                                    <Landmark className="w-5 h-5 text-blue-400 mb-1" />
                                    <span className="text-2xl font-bold text-white leading-none">{empPayslips.length}</span>
                                    <span className="text-[10px] text-white/50 uppercase tracking-wide">Payslips</span>
                                </button>
                            </div>
                            <AiActionsPanel
                                entityType="HrEmployee"
                                entityId={String(activeRecord.id)}
                                agentKey="customer-summary"
                            />
                            <ChatterPanel
                                ownerType="HrEmployee"
                                ownerId={activeRecord.id}
                                showTimeline
                            />
                        </div>
                    );
                })() : undefined
            }
        />
    );

    // --------------------------------------------------------------------------
    // DEPARTMENTS VIEW
    // --------------------------------------------------------------------------
    const renderDepartmentsKanban = () => {
        const filteredDepartments = departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {filteredDepartments.map(dept => (
                    <div
                        key={dept.id}
                        onClick={() => handleRowClick(dept)}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/10 hover:border-primary-purple/50 transition-all flex flex-col gap-4 group shadow-sm backdrop-blur-md relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-purple/50"></div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-white group-hover:text-primary-purple transition-colors truncate">{dept.name}</h3>
                            <div className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded">
                                {dept._count?.employees || 0} Employees
                            </div>
                        </div>

                        {(dept.manager || dept.managerId) && (
                            <div className="flex items-center gap-2 mt-auto text-sm text-white/60 bg-white/5 p-2 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
                                    {(dept.manager?.name || 'MG').substring(0, 2)}
                                </div>
                                <span>{dept.manager?.name || `Manager ID: ${dept.managerId}`}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    const renderDepartmentsList = () => (
        <OdooListBase
            data={departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(d) => d.id.toString()}
            columns={[
                { key: 'name', label: 'Department Name', render: (d) => <span className="font-bold">{d.name}</span> },
                { key: 'manager', label: 'Manager', render: (d) => d.manager?.name || '' },
                { key: 'employees', label: 'Employees', render: (d) => d._count?.employees || 0 },
            ]}
        />
    );

    const renderDepartmentForm = () => (
        <OdooFormBase
            statusRibbon={<div className="h-6"></div>}
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Department Name"
                        value={departmentFormData.name || ''}
                        onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Parent Department</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={departmentFormData.parentId || ''}
                                onChange={(e) => setDepartmentFormData({ ...departmentFormData, parentId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {departments.filter(d => d.id !== activeRecord?.id).map(d => (
                                    <option key={d.id} value={d.id} className="text-black">{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Manager</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={departmentFormData.managerId || ''}
                                onChange={(e) => setDepartmentFormData({ ...departmentFormData, managerId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id} className="text-black">{e.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            rightPanels={
                activeRecord ? (
                    <div className="space-y-4">
                        <ChatterPanel
                            ownerType="HrDepartment"
                            ownerId={activeRecord.id}
                            showTimeline
                        />
                    </div>
                ) : undefined
            }
        />
    );

    const renderHierarchy = () => {
        if (activeTab === 'employees') {
            // Employee Org Chart (Manager -> Subordinates)
            const buildEmployeeTree = (managerId: number | null = null): HierarchyNode[] => {
                return employees
                    .filter(e => e.managerId === managerId)
                    .map(emp => ({
                        id: emp.id,
                        name: emp.name,
                        subtitle: emp.job?.name || emp.jobId?.toString() || 'Position',
                        details: [
                            { icon: <Mail className="w-3 h-3" />, text: emp.workEmail || 'No Email' },
                            { icon: <Building className="w-3 h-3" />, text: emp.department?.name || 'No Dept' }
                        ],
                        color: emp.department?.id === 1 ? '#a855f7' : emp.department?.id === 2 ? '#3b82f6' : '#10b981',
                        children: buildEmployeeTree(emp.id)
                    }));
            };

            const data = buildEmployeeTree(null); // Roots (no manager)
            return <HierarchyView data={data} onNodeClick={(id) => handleRowClick(employees.find(e => e.id === id))} />;
        } else {
            // Department Hierarchy
            const buildDeptTree = (parentId: number | null = null): HierarchyNode[] => {
                return departments
                    .filter(d => d.parentId === parentId)
                    .map(dept => ({
                        id: dept.id,
                        name: dept.name,
                        subtitle: `${dept._count?.employees || 0} Employees`,
                        details: [
                            { icon: <Briefcase className="w-3 h-3" />, text: dept.manager?.name || 'No Manager' },
                            { icon: <MapPin className="w-3 h-3" />, text: 'HQ Global' }
                        ],
                        color: '#6366f1',
                        children: buildDeptTree(dept.id)
                    }));
            };

            const data = buildDeptTree(null);
            return <HierarchyView data={data} onNodeClick={(id) => handleRowClick(departments.find(d => d.id === id))} />;
        }
    };

    return (
        <OdooViewManager
            title={activeTab === 'employees' ? 'Employees' : 'Departments'}
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'hierarchy', 'form']}
        >
            <div className="flex gap-4 border-b border-white/10 mb-6 px-4">
                {[
                    { id: 'employees', label: 'Employees' },
                    { id: 'departments', label: 'Departments' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary-purple text-primary-purple' : 'border-transparent text-white/60 hover:text-white'
                            }`}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            setCurrentView('kanban');
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {currentView === 'kanban' && (activeTab === 'employees' ? renderEmployeesKanban() : renderDepartmentsKanban())}
            {currentView === 'list' && (activeTab === 'employees' ? renderEmployeesList() : renderDepartmentsList())}
            {currentView === 'hierarchy' && renderHierarchy()}
            {currentView === 'form' && (activeTab === 'employees' ? renderEmployeeForm() : renderDepartmentForm())}
        </OdooViewManager>
    );
};
