import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Shield, Globe, Database, ToggleLeft, ToggleRight, ChevronRight, Save, Server, Fingerprint, CreditCard, Plus, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ModuleConfig { id: string; name: string; enabled: boolean; description: string; }

const defaultModules: ModuleConfig[] = [
    { id: 'crm', name: 'CRM', enabled: true, description: 'Customer relationship management' },
    { id: 'sales', name: 'Sales', enabled: true, description: 'Quotations and sales orders' },
    { id: 'purchase', name: 'Purchase', enabled: true, description: 'Purchase orders and vendor management' },
    { id: 'inventory', name: 'Inventory', enabled: true, description: 'Stock management and warehousing' },
    { id: 'accounting', name: 'Accounting', enabled: true, description: 'Financial management and invoicing' },
    { id: 'hr', name: 'HR', enabled: true, description: 'Employee management' },
    { id: 'manufacturing', name: 'Manufacturing', enabled: true, description: 'Production orders and BOMs' },
    { id: 'pos', name: 'Point of Sale', enabled: true, description: 'Retail terminal management' },
    { id: 'project', name: 'Project', enabled: true, description: 'Project and task management' },
    { id: 'helpdesk', name: 'Helpdesk', enabled: true, description: 'Support ticket management' },
    { id: 'calendar', name: 'Calendar', enabled: true, description: 'Events and scheduling' },
    { id: 'fleet', name: 'Fleet', enabled: true, description: 'Vehicle management' },
    { id: 'maintenance', name: 'Maintenance', enabled: true, description: 'Equipment maintenance' },
    { id: 'surveys', name: 'Surveys', enabled: true, description: 'Feedback collection' },
    { id: 'notes', name: 'Notes', enabled: true, description: 'Personal to-do and notes management' },
    { id: 'events', name: 'Events', enabled: true, description: 'Conference management' },
    { id: 'timesheets', name: 'Timesheets', enabled: true, description: 'Time tracking' },
    { id: 'email-marketing', name: 'Email Marketing', enabled: false, description: 'Campaign management' },
    { id: 'website', name: 'Website', enabled: false, description: 'CMS and page builder' },
    { id: 'knowledge', name: 'Knowledge', enabled: true, description: 'Knowledge base articles' },
    { id: 'rental', name: 'Rental', enabled: false, description: 'Asset rental management' },
    { id: 'subscriptions', name: 'Subscriptions', enabled: false, description: 'Recurring billing' },
    { id: 'planning', name: 'Planning', enabled: true, description: 'Resource planning' },
    { id: 'studio', name: 'Studio', enabled: false, description: 'No-code customization' },
    { id: 'leaves', name: 'Time Off', enabled: true, description: 'Employee leave tracking' },
    { id: 'expenses', name: 'Expenses', enabled: true, description: 'Expense reports and reimbursement' },
];

interface UserEntry { id: string | number; name: string; email: string; role?: string; active: boolean; }

type Tab = 'general' | 'modules' | 'users' | 'security' | 'accounting' | 'technical';

interface PaymentTerm { id: number; name: string; note: string | null; }
interface Pricelist { id: number; name: string; currency: string; active: boolean; }

const SettingsPage: React.FC = () => {
    const { user, registerPasskey } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [modules, setModules] = useState<ModuleConfig[]>(defaultModules);
    const [saved, setSaved] = useState(false);

    const [general, setGeneral] = useState({
        companyName: 'FusionAI Enterprise', language: 'en', timezone: 'UTC',
        currency: 'USD', dateFormat: 'MM/DD/YYYY', notifications: true, darkMode: true,
    });

    const { data: serverSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await axios.get('/api/settings');
            return res.data;
        }
    });

    useEffect(() => {
        if (serverSettings && Object.keys(serverSettings).length > 0) {
            setGeneral({
                companyName: serverSettings['general.companyName'] || 'FusionAI Enterprise',
                language: serverSettings['general.language'] || 'en',
                timezone: serverSettings['general.timezone'] || 'UTC',
                currency: serverSettings['general.currency'] || 'USD',
                dateFormat: serverSettings['general.dateFormat'] || 'MM/DD/YYYY',
                notifications: serverSettings['general.notifications'] !== 'false',
                darkMode: serverSettings['general.darkMode'] !== 'false',
            });

            setModules(prev => prev.map(m => {
                const settingKey = `module.${m.id}.enabled`;
                if (serverSettings[settingKey] !== undefined) {
                    return { ...m, enabled: serverSettings[settingKey] === 'true' };
                }
                return m;
            }));
        }
    }, [serverSettings]);

    const saveMutation = useMutation({
        mutationFn: async (payload: Record<string, string>) => {
            await axios.post('/api/settings', payload);
        },
        onSuccess: () => {
            toast.success('Settings saved successfully');
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            setSaved(true); setTimeout(() => setSaved(false), 2000);
        },
        onError: () => {
            toast.error('Failed to save settings');
        }
    });

    const toggleModule = (id: string) => {
        setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    };

    // ── Platform Users (live) ────────────────────────────────────────────────────
    const { data: platformUsers = [] } = useQuery<UserEntry[]>({
        queryKey: ['settings-users'],
        queryFn: async () => (await axios.get('/api/settings/users')).data ?? [],
    });

    // ── Payment Terms ────────────────────────────────────────────────────────────
    const { data: paymentTerms = [], refetch: refetchPT } = useQuery<PaymentTerm[]>({
        queryKey: ['paymentTerms'],
        queryFn: async () => (await axios.get('/api/payment-terms?limit=100')).data.data ?? [],
    });
    const [ptForm, setPtForm] = useState({ name: '', note: '' });
    const [ptCreating, setPtCreating] = useState(false);
    const createPT = async () => {
        if (!ptForm.name.trim()) return;
        try {
            await axios.post('/api/payment-terms', ptForm);
            setPtForm({ name: '', note: '' });
            setPtCreating(false);
            await refetchPT();
            toast.success('Payment term created');
        } catch { toast.error('Failed to create payment term'); }
    };
    const deletePT = async (id: number) => {
        try {
            await axios.delete(`/api/payment-terms/${id}`);
            await refetchPT();
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    // ── Pricelists ───────────────────────────────────────────────────────────────
    const { data: pricelists = [], refetch: refetchPL } = useQuery<Pricelist[]>({
        queryKey: ['pricelists'],
        queryFn: async () => (await axios.get('/api/pricelists?limit=100')).data.data ?? [],
    });
    const [plForm, setPlForm] = useState({ name: '', currency: 'USD' });
    const [plCreating, setPlCreating] = useState(false);
    const createPL = async () => {
        if (!plForm.name.trim()) return;
        try {
            await axios.post('/api/pricelists', plForm);
            setPlForm({ name: '', currency: 'USD' });
            setPlCreating(false);
            await refetchPL();
            toast.success('Pricelist created');
        } catch { toast.error('Failed to create pricelist'); }
    };
    const deletePL = async (id: number) => {
        try {
            await axios.delete(`/api/pricelists/${id}`);
            await refetchPL();
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const handleSave = () => {
        const payload: Record<string, string> = {
            'general.companyName': general.companyName,
            'general.language': general.language,
            'general.timezone': general.timezone,
            'general.currency': general.currency,
            'general.dateFormat': general.dateFormat,
            'general.notifications': String(general.notifications),
            'general.darkMode': String(general.darkMode),
        };
        modules.forEach(m => {
            payload[`module.${m.id}.enabled`] = String(m.enabled);
        });
        saveMutation.mutate(payload);
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'modules', label: 'Modules', icon: Database },
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'accounting', label: 'Accounting', icon: CreditCard },
        { id: 'technical', label: 'Technical', icon: Server },
    ];

    const roleBadge = (role: string) => {
        const c: Record<string, string> = {
            Admin: 'bg-red-500/20 text-red-400',
            Manager: 'bg-blue-500/20 text-blue-400',
            User: 'bg-gray-500/20 text-gray-400',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c[role] || c.User}`}>{role}</span>;
    };

    const handleRegisterPasskey = async () => {
        if (!user) {
            toast.error('You must be logged in to register a passkey');
            return;
        }
        try {
            await registerPasskey(parseInt(user.id));
        } catch (err) {
            // Error already handled in AuthContext with toast
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-primary-purple to-secondary-purple p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="absolute rounded-full bg-gradient-to-r from-slate-500/10 to-gray-500/10 blur-3xl"
                        style={{ width: `${280 + i * 90}px`, height: `${280 + i * 90}px`, left: `${12 + i * 26}%`, top: `${6 + i * 22}%` }}
                        animate={{ x: [0, 50, 0], y: [0, -35, 0] }}
                        transition={{ duration: 22 + i * 3, repeat: Infinity, ease: "easeInOut" }} />
                ))}
            </div>
            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <Settings className="w-10 h-10 text-white/80" />Settings
                            </h1>
                            <p className="text-white/70 text-lg">Platform configuration and administration</p>
                        </div>
                        <button onClick={handleSave}
                            className={`px-6 py-3 rounded-lg font-medium shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl'
                                }`}>
                            <Save className="w-5 h-5" />{saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>

                <div className="flex gap-6">
                    {/* Sidebar tabs */}
                    <div className="w-56 flex-shrink-0">
                        <GlassCard className="p-2">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-1 ${activeTab === tab.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                                        }`}>
                                    <tab.icon className="w-5 h-5" />{tab.label}
                                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                                </button>
                            ))}
                        </GlassCard>
                    </div>

                    {/* Content area */}
                    <div className="flex-1">
                        {activeTab === 'general' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <GlassCard className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <Globe className="w-5 h-5" />General Settings
                                    </h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-white/60 text-sm mb-1 block">Company Name</label>
                                            <input value={general.companyName}
                                                onChange={e => setGeneral(p => ({ ...p, companyName: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-white/60 text-sm mb-1 block">Language</label>
                                                <select value={general.language}
                                                    onChange={e => setGeneral(p => ({ ...p, language: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none appearance-none">
                                                    <option value="en">English</option>
                                                    <option value="et">Estonian</option>
                                                    <option value="de">German</option>
                                                    <option value="fr">French</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-white/60 text-sm mb-1 block">Timezone</label>
                                                <select value={general.timezone}
                                                    onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none appearance-none">
                                                    <option value="UTC">UTC</option>
                                                    <option value="Europe/Tallinn">Europe/Tallinn</option>
                                                    <option value="US/Eastern">US/Eastern</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-white/60 text-sm mb-1 block">Currency</label>
                                                <select value={general.currency}
                                                    onChange={e => setGeneral(p => ({ ...p, currency: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none appearance-none">
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-white/60 text-sm mb-1 block">Date Format</label>
                                                <select value={general.dateFormat}
                                                    onChange={e => setGeneral(p => ({ ...p, dateFormat: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none appearance-none">
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-t border-white/10">
                                            <div>
                                                <p className="text-white font-medium">Notifications</p>
                                                <p className="text-white/40 text-sm">Receive email and in-app notifications</p>
                                            </div>
                                            <button onClick={() => setGeneral(p => ({ ...p, notifications: !p.notifications }))}>
                                                {general.notifications
                                                    ? <ToggleRight className="w-8 h-8 text-green-400" />
                                                    : <ToggleLeft className="w-8 h-8 text-white/40" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-t border-white/10">
                                            <div>
                                                <p className="text-white font-medium">Dark Mode</p>
                                                <p className="text-white/40 text-sm">Use dark interface theme</p>
                                            </div>
                                            <button onClick={() => setGeneral(p => ({ ...p, darkMode: !p.darkMode }))}>
                                                {general.darkMode
                                                    ? <ToggleRight className="w-8 h-8 text-green-400" />
                                                    : <ToggleLeft className="w-8 h-8 text-white/40" />}
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {activeTab === 'modules' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <GlassCard className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                        <Database className="w-5 h-5" />Installed Modules
                                    </h2>
                                    <p className="text-white/40 text-sm mb-6">Enable or disable modules for your organization</p>
                                    <div className="space-y-2">
                                        {modules.map(mod => (
                                            <div key={mod.id}
                                                className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                                <div>
                                                    <p className="text-white font-medium">{mod.name}</p>
                                                    <p className="text-white/40 text-sm">{mod.description}</p>
                                                </div>
                                                <button onClick={() => toggleModule(mod.id)}>
                                                    {mod.enabled
                                                        ? <ToggleRight className="w-8 h-8 text-green-400" />
                                                        : <ToggleLeft className="w-8 h-8 text-white/30" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10 text-white/40 text-sm">
                                        {modules.filter(m => m.enabled).length} of {modules.length} modules enabled
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <GlassCard className="overflow-hidden">
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <Shield className="w-5 h-5" />Users & Roles
                                        </h2>
                                        <div className="flex gap-2 text-sm">
                                            <span className="px-3 py-1 bg-white/10 text-white/60 rounded-lg">
                                                {platformUsers.length} users
                                            </span>
                                            <span className="px-3 py-1 bg-white/10 text-white/60 rounded-lg">3 roles</span>
                                        </div>
                                    </div>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left px-6 py-3 text-white/60 text-sm">Name</th>
                                                <th className="text-left px-6 py-3 text-white/60 text-sm">Email</th>
                                                <th className="text-left px-6 py-3 text-white/60 text-sm">Role</th>
                                                <th className="text-center px-6 py-3 text-white/60 text-sm">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {platformUsers.map(u => (
                                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {u.name[0]}
                                                        </div>
                                                        {u.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-white/60">{u.email}</td>
                                                    <td className="px-6 py-4">{roleBadge(u.role ?? 'User')}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-2.5 h-2.5 rounded-full mx-auto ${u.active ? 'bg-green-400' : 'bg-red-400'}`} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </GlassCard>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <GlassCard className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-400" />Security & Authentication
                                    </h2>
                                    <p className="text-white/60 mb-6">Manage your account security and authentication methods.</p>

                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                    <Fingerprint className="w-7 h-7 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-white">Passkey Authentication</h3>
                                                    <p className="text-white/40 text-sm">Use biometrics or security keys to sign in securely.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRegisterPasskey}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                Register New Passkey
                                            </button>
                                        </div>
                                        <p className="text-xs text-white/30 italic">
                                            Passkeys provide a faster and more secure way to sign in without using passwords.
                                        </p>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {activeTab === 'accounting' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {/* Payment Terms */}
                                <GlassCard className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-blue-400" />Payment Terms
                                        </h2>
                                        <button onClick={() => setPtCreating(v => !v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm transition-colors">
                                            <Plus className="w-4 h-4" /> New
                                        </button>
                                    </div>
                                    {ptCreating && (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 space-y-3">
                                            <input placeholder="Name (e.g. Net 30)" value={ptForm.name}
                                                onChange={e => setPtForm(p => ({ ...p, name: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-blue-400/60" />
                                            <input placeholder="Note (optional)" value={ptForm.note}
                                                onChange={e => setPtForm(p => ({ ...p, note: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-blue-400/60" />
                                            <div className="flex gap-2">
                                                <button onClick={createPT}
                                                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Save</button>
                                                <button onClick={() => setPtCreating(false)}
                                                    className="px-3 py-1.5 bg-white/5 text-white/60 hover:bg-white/10 rounded-lg text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {paymentTerms.length === 0 && (
                                            <p className="text-white/30 text-sm py-4 text-center">No payment terms yet. Create one above.</p>
                                        )}
                                        {paymentTerms.map(pt => (
                                            <div key={pt.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/8 transition-all">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{pt.name}</p>
                                                    {pt.note && <p className="text-white/40 text-xs mt-0.5">{pt.note}</p>}
                                                </div>
                                                <button onClick={() => deletePT(pt.id)}
                                                    className="text-white/20 hover:text-red-400 transition-colors p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>

                                {/* Pricelists */}
                                <GlassCard className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-purple-400" />Pricelists
                                        </h2>
                                        <button onClick={() => setPlCreating(v => !v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm transition-colors">
                                            <Plus className="w-4 h-4" /> New
                                        </button>
                                    </div>
                                    {plCreating && (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 space-y-3">
                                            <input placeholder="Name (e.g. Wholesale EUR)" value={plForm.name}
                                                onChange={e => setPlForm(p => ({ ...p, name: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-purple-400/60" />
                                            <select value={plForm.currency}
                                                onChange={e => setPlForm(p => ({ ...p, currency: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none appearance-none">
                                                {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2">
                                                <button onClick={createPL}
                                                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm">Save</button>
                                                <button onClick={() => setPlCreating(false)}
                                                    className="px-3 py-1.5 bg-white/5 text-white/60 hover:bg-white/10 rounded-lg text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {pricelists.length === 0 && (
                                            <p className="text-white/30 text-sm py-4 text-center">No pricelists yet. Create one above.</p>
                                        )}
                                        {pricelists.map(pl => (
                                            <div key={pl.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/8 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{pl.currency}</span>
                                                    <p className="text-white font-medium text-sm">{pl.name}</p>
                                                    {!pl.active && <span className="text-xs text-white/30">(inactive)</span>}
                                                </div>
                                                <button onClick={() => deletePL(pl.id)}
                                                    className="text-white/20 hover:text-red-400 transition-colors p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {activeTab === 'technical' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <GlassCard className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <Server className="w-5 h-5" />System Information
                                    </h2>
                                    <div className="space-y-3">
                                        {[
                                            ['Platform', 'FusionAI Enterprise Suite'],
                                            ['Version', '2.0.0'],
                                            ['Backend', 'Node.js + Express + Prisma'],
                                            ['Database', 'SQLite (dev) / PostgreSQL (prod)'],
                                            ['Frontend', 'React 18 + Vite + Tailwind'],
                                            ['API Endpoint', '/api'],
                                            ['Modules Loaded', String(modules.filter(m => m.enabled).length)],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex justify-between py-2 border-b border-white/5">
                                                <span className="text-white/60">{k}</span>
                                                <span className="text-white font-mono text-sm">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-6">
                                    <h2 className="text-lg font-semibold text-white mb-4">Deployment</h2>
                                    <p className="text-white/60 text-sm mb-4">Use Docker Compose to deploy the full stack:</p>
                                    <pre className="bg-black/30 p-4 rounded-lg text-sm text-green-400 font-mono overflow-x-auto">
                                        {'docker compose up -d\ndocker compose logs -f\ndocker compose up --build -d'}
                                    </pre>
                                </GlassCard>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
