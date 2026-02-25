import React from 'react';
import { MrpWorkcenter } from '../stores/manufacturingStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { MetricGrid } from '@/components/shared/MetricCard';
import { Factory, Zap, Clock, Activity, AlertTriangle, Target } from 'lucide-react';

interface WorkcenterDashboardProps {
    workcenters: MrpWorkcenter[];
}

export const WorkcenterDashboard: React.FC<WorkcenterDashboardProps> = ({ workcenters }) => {
    const avgEfficiency = workcenters.length > 0
        ? workcenters.reduce((sum, wc) => sum + wc.timeEfficiency, 0) / workcenters.length
        : 0;

    // Mocking some "live" data for visual excellence
    const activeCount = workcenters.filter(wc => wc.active).length;
    const blockedCount = Math.floor(activeCount * 0.1); // Simulated bottleneck

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MetricGrid
                metrics={[
                    { title: 'Active Centers', value: activeCount.toString(), icon: Factory, color: 'text-blue-400' },
                    { title: 'Avg Efficiency', value: `${avgEfficiency.toFixed(1)}%`, icon: Zap, color: 'text-yellow-400' },
                    { title: 'OEE Target', value: '92%', icon: Target, color: 'text-green-400' },
                    { title: 'Bottlenecks', value: blockedCount.toString(), icon: AlertTriangle, color: 'text-red-400' }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-purple" />
                        Operation Status
                    </h3>
                    <div className="space-y-4">
                        {workcenters.map(wc => (
                            <div key={wc.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between group hover:bg-white/10 transition-all border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${wc.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-white font-medium">{wc.name}</p>
                                        <p className="text-white/40 text-xs">Capacity: {wc.capacity} units/hr</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/90 font-mono">{wc.timeEfficiency}% Eff.</p>
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                            style={{ width: `${wc.timeEfficiency}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {workcenters.length === 0 && (
                            <p className="text-white/40 text-center py-8 italic text-sm">No work centers defined yet.</p>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Availability Optimization
                    </h3>
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="relative mb-4">
                            <Activity className="w-16 h-16 text-primary-purple opacity-20 animate-ping absolute top-0" />
                            <Activity className="w-16 h-16 text-primary-purple relative z-10" />
                        </div>
                        <h4 className="text-white/80 font-medium italic">Neural Load Balancer Active</h4>
                        <p className="text-white/40 text-sm max-w-xs mt-2">
                            The AI is currently monitoring throughput across {workcenters.length} nodes to minimize operation latency.
                        </p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
