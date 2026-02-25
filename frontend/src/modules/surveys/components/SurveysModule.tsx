import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useSurveysStore, Survey } from '../stores/surveysStore';
import { ClipboardList, Users, CheckSquare, Edit } from 'lucide-react';

export const SurveysModule: React.FC = () => {
    const {
        surveys,
        fetchSurveys,
        createSurvey,
        updateSurvey
    } = useSurveysStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<Survey | null>(null);
    const [formData, setFormData] = useState<Partial<Survey>>({
        state: 'draft',
        scoringType: 'no_scoring'
    });

    useEffect(() => {
        fetchSurveys();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            state: 'draft',
            scoringType: 'no_scoring',
            title: 'New Survey'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: Survey) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateSurvey(activeRecord.id, formData);
        } else {
            const newSurvey = await createSurvey(formData);
            if (newSurvey) setActiveRecord(newSurvey);
        }
        setCurrentView('kanban');
    };

    const handleAction = async (state: string) => {
        if (!activeRecord) return;
        const updates: Partial<Survey> = { state };
        await updateSurvey(activeRecord.id, updates);
        setActiveRecord({ ...activeRecord, ...updates });
        setFormData({ ...formData, ...updates });
    };

    const activeCount = surveys.filter(s => s.state === 'open').length;
    const totalResponses = surveys.reduce((acc, s) => acc + (s._count?.responses || 0), 0);
    const totalQuestions = surveys.reduce((acc, s) => acc + (s._count?.questions || 0), 0);

    const renderDashboardCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Active Surveys</p>
                        <h3 className="text-2xl font-bold text-white">
                            {activeCount}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Responses</p>
                        <h3 className="text-2xl font-bold text-white">
                            {totalResponses}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Questions</p>
                        <h3 className="text-2xl font-bold text-white">
                            {totalQuestions}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );

    const filteredSurveys = surveys.filter(s => s.title?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderKanban = () => (
        <div>
            {renderDashboardCards()}
            <OdooListBase
                data={filteredSurveys}
                onRowClick={handleRowClick}
                keyExtractor={(t) => t.id.toString()}
                columns={[
                    { key: 'title', label: 'Survey Title', render: (t) => <span className="font-bold">{t.title}</span> },
                    { key: 'questions', label: 'Questions', render: (t) => t._count?.questions || 0 },
                    { key: 'responses', label: 'Responses', render: (t) => t._count?.responses || 0 },
                    { key: 'scoring', label: 'Scoring', render: (t) => <span className="capitalize">{t.scoringType.replace(/_/g, ' ')}</span> },
                    {
                        key: 'state', label: 'Status', render: (t) => (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                            ${t.state === 'open' ? 'bg-green-500/20 text-green-400' :
                                    t.state === 'closed' ? 'bg-red-500/20 text-red-500' :
                                        'bg-yellow-500/20 text-yellow-500'}
                        `}>
                                {t.state}
                            </span>
                        )
                    },
                ]}
            />
        </div>
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2">
                        {formData.state === 'draft' && (
                            <button onClick={() => handleAction('open')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] shadow-green-500/20">Start Survey</button>
                        )}
                        {formData.state === 'open' && (
                            <button onClick={() => handleAction('closed')} className="bg-red-600/50 hover:bg-red-500 text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">Close Survey</button>
                        )}
                        {formData.state === 'closed' && (
                            <button onClick={() => handleAction('draft')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-sm transition-colors border border-white/10">Set to Draft</button>
                        )}
                        <button className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30">
                            Test / View
                        </button>
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Survey Title..."
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Description</label>
                        <textarea
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-purple transition-all resize-none"
                            placeholder="Add survey instructions or details..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Scoring Options</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                            value={formData.scoringType || 'no_scoring'}
                            onChange={(e) => setFormData({ ...formData, scoringType: e.target.value })}
                        >
                            <option value="no_scoring" className="bg-gray-900">No Scoring</option>
                            <option value="scoring_with_answers" className="bg-gray-900">Scoring with Answers</option>
                            <option value="scoring_without_answers" className="bg-gray-900">Scoring without Answers</option>
                        </select>
                    </div>
                </div>
            }
            rightPanels={
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-fuchsia-400" />
                            Content
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-white/60">Questions Defined</span>
                                <span className="text-white font-bold">{formData._count?.questions || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Responses
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-white/60">Total Participants</span>
                                <span className="text-white font-bold">{formData._count?.responses || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title="Surveys"
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('kanban')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={['kanban', 'list', 'form']}
        >
            {currentView === 'kanban' && renderKanban()}
            {currentView === 'list' && renderKanban()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
