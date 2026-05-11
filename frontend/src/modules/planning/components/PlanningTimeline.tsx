import React from 'react';
import { PlanningSlot } from '../stores/planningStore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlanningTimelineProps {
    slots: PlanningSlot[];
    onSlotClick: (slot: PlanningSlot) => void;
}

export const PlanningTimeline: React.FC<PlanningTimelineProps> = ({ slots, onSlotClick }) => {
    const [startDate, setStartDate] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

    // Group slots by employee
    const employees = Array.from(new Set(slots.map(s => s.employeeId).filter(Boolean)));
    const employeeMap = slots.reduce((acc, s) => {
        if (s.employeeId) {
            if (!acc[s.employeeId]) acc[s.employeeId] = { name: s.employee?.name || `Employee ${s.employeeId}`, slots: [] };
            acc[s.employeeId].slots.push(s);
        }
        return acc;
    }, {} as Record<number, { name: string; slots: PlanningSlot[] }>);

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">Resource_Utilization</h3>
                    <div className="flex gap-1">
                        <button onClick={() => setStartDate(addDays(startDate, -7))} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronLeft className="w-4 h-4 text-white/60" /></button>
                        <button onClick={() => setStartDate(addDays(startDate, 7))} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronRight className="w-4 h-4 text-white/60" /></button>
                    </div>
                </div>
                <span className="text-xs font-bold text-white/80">{format(startDate, 'MMM d')} — {format(addDays(startDate, 13), 'MMM d, yyyy')}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-[#0a0a0a] w-64 p-4 text-left border-r border-white/10">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Resource</span>
                            </th>
                            {days.map(day => (
                                <th key={day.toISOString()} className={`p-3 text-center min-w-[50px] border-r border-white/5 ${isSameDay(day, new Date()) ? 'bg-primary-500/10' : ''}`}>
                                    <div className="text-[9px] font-bold text-white/40 uppercase">{format(day, 'EEE')}</div>
                                    <div className={`text-xs font-black ${isSameDay(day, new Date()) ? 'text-primary-500' : 'text-white/80'}`}>{format(day, 'd')}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(employeeMap).map(([id, data]) => (
                            <tr key={id} className="border-t border-white/5 group hover:bg-white/[0.02] transition-colors">
                                <td className="sticky left-0 z-10 bg-[#0a0a0a] border-r border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                                            <User className="w-4 h-4 text-white/40" />
                                        </div>
                                        <span className="text-sm font-bold text-white group-hover:text-primary-500 transition-colors">{data.name}</span>
                                    </div>
                                </td>
                                {days.map(day => {
                                    const activeSlot = data.slots.find(s => {
                                        const start = new Date(s.startDate);
                                        const end = new Date(s.endDate);
                                        return day >= start && day <= end;
                                    });
                                    return (
                                        <td key={day.toISOString()} className="p-1 h-14 border-r border-white/5 relative">
                                            {activeSlot && (
                                                <div
                                                    onClick={() => onSlotClick(activeSlot)}
                                                    className={`absolute inset-1 rounded flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg z-0 ${activeSlot.state === 'published' ? 'bg-primary-500/40 border border-primary-500/50' : 'bg-white/10 border border-white/20'}`}
                                                >
                                                    <span className="text-[8px] font-black text-white/60 truncate px-1 uppercase tracking-tighter">
                                                        {activeSlot.project?.name || 'BUSY'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
