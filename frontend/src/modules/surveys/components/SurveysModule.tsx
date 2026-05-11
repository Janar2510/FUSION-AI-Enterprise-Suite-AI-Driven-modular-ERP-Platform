import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useSurveysStore, Survey } from '../stores/surveysStore';
import { ClipboardList, Users, CheckSquare, Edit, PlusCircle, Trash2, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

// ── Inline Question Builder ───────────────────────────────────────────────────

interface SurveyQuestion {
    id: number;
    title: string;
    questionType: string;
    isRequired: boolean;
    sequence: number;
    answers?: Array<{ id: number; value: string }>;
}

interface QuestionBuilderProps {
    surveyId: number;
}

const QUESTION_TYPES = [
    { value: 'text_box', label: 'Text Box' },
    { value: 'char_box', label: 'Short Answer' },
    { value: 'numerical_box', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'multiple_choice_multi', label: 'Checkboxes' },
];

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ surveyId }) => {
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [newQ, setNewQ] = useState({ title: '', questionType: 'text_box', isRequired: false });
    const [newAnswerText, setNewAnswerText] = useState<Record<number, string>>({});

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/surveys/${surveyId}`);
            setQuestions(res.data?.questions ?? []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [surveyId]);

    const addQuestion = async () => {
        if (!newQ.title.trim()) return;
        await api.post(`/surveys/${surveyId}/questions`, { ...newQ, sequence: questions.length + 1 });
        setNewQ({ title: '', questionType: 'text_box', isRequired: false });
        load();
    };

    const deleteQuestion = async (qId: number) => {
        await api.delete(`/surveys/questions/${qId}`);
        load();
    };

    const addAnswer = async (qId: number) => {
        const value = newAnswerText[qId]?.trim();
        if (!value) return;
        await api.post(`/surveys/questions/${qId}/answers`, { value });
        setNewAnswerText(prev => ({ ...prev, [qId]: '' }));
        load();
    };

    if (loading) return <div className="text-white/40 text-sm py-4">Loading questions…</div>;

    return (
        <div className="space-y-4">
            {/* Question list */}
            {questions.map((q, idx) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    >
                        <span className="text-white/40 text-xs w-5 text-right shrink-0">{idx + 1}.</span>
                        <span className="text-white text-sm flex-1 font-medium">{q.title}</span>
                        <span className="text-white/40 text-xs px-2 py-0.5 bg-white/5 rounded">{q.questionType.replace(/_/g, ' ')}</span>
                        {q.isRequired && <span className="text-red-400 text-xs">Required</span>}
                        <button onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }} className="text-red-400/60 hover:text-red-400 transition-colors ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {expandedId === q.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>

                    {expandedId === q.id && ['multiple_choice', 'multiple_choice_multi'].includes(q.questionType) && (
                        <div className="px-4 pb-3 border-t border-white/10 space-y-2 pt-3">
                            <p className="text-white/40 text-xs mb-2">Answer options</p>
                            {(q.answers ?? []).map(a => (
                                <div key={a.id} className="flex items-center gap-2 text-sm text-white/70">
                                    <span className="w-2 h-2 rounded-full bg-primary-500/60 shrink-0" />
                                    {a.value}
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                <input
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-primary-500"
                                    placeholder="Add option…"
                                    value={newAnswerText[q.id] ?? ''}
                                    onChange={e => setNewAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') addAnswer(q.id); }}
                                />
                                <button onClick={() => addAnswer(q.id)} className="bg-primary-500/20 hover:bg-primary-500/40 text-white px-2 py-1 rounded text-xs transition-colors border border-primary-500/30">Add</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Add question row */}
            <div className="bg-white/5 border border-dashed border-white/20 rounded-lg p-4 space-y-3">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">New Question</p>
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-primary-500"
                        placeholder="Question text…"
                        value={newQ.title}
                        onChange={e => setNewQ(prev => ({ ...prev, title: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') addQuestion(); }}
                    />
                    <select
                        className="bg-white/5 border border-white/10 rounded-md px-2 py-2 text-white text-sm outline-none focus:border-primary-500"
                        value={newQ.questionType}
                        onChange={e => setNewQ(prev => ({ ...prev, questionType: e.target.value }))}
                    >
                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-white/50 text-xs cursor-pointer">
                        <input type="checkbox" checked={newQ.isRequired} onChange={e => setNewQ(prev => ({ ...prev, isRequired: e.target.checked }))} className="accent-primary-500" />
                        Req.
                    </label>
                    <button onClick={addQuestion} className="bg-primary-500/20 hover:bg-primary-500/40 text-white px-3 py-2 rounded-md text-sm transition-colors border border-primary-500/30 flex items-center gap-1">
                        <PlusCircle className="w-4 h-4" /> Add
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Results Analytics Tab ─────────────────────────────────────────────────────

interface ResultsTabProps {
    surveyId: number;
}

interface QuestionStat {
    questionId: number;
    title: string;
    questionType: string;
    totalAnswers: number;
    options?: Array<{ label: string; count: number }>;
    numericAvg?: number | null;
    numericMin?: number | null;
    numericMax?: number | null;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ surveyId }) => {
    const [stats, setStats] = useState<{ totalResponses: number; questions: QuestionStat[] } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!surveyId) return;
        setLoading(true);
        api.get(`/surveys/${surveyId}/results`)
            .then(r => setStats(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [surveyId]);

    if (loading) return <div className="text-white/40 text-sm py-4">Loading results…</div>;
    if (!stats) return <div className="text-white/40 text-sm py-4">No results yet.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                <div>
                    <p className="text-white/60 text-xs">Total Responses</p>
                    <p className="text-2xl font-bold text-white">{stats.totalResponses}</p>
                </div>
            </div>

            {stats.questions.map(q => (
                <div key={q.questionId} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <p className="text-white font-medium text-sm">{q.title}</p>
                    <p className="text-white/40 text-xs">{q.totalAnswers} answer{q.totalAnswers !== 1 ? 's' : ''}</p>

                    {q.options && q.options.length > 0 && (
                        <div className="space-y-2">
                            {q.options.map(o => {
                                const pct = q.totalAnswers > 0 ? Math.round((o.count / q.totalAnswers) * 100) : 0;
                                return (
                                    <div key={o.label} className="space-y-1">
                                        <div className="flex justify-between text-xs text-white/70">
                                            <span>{o.label}</span>
                                            <span>{o.count} ({pct}%)</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {q.numericAvg != null && (
                        <div className="flex gap-6 text-sm text-white/70">
                            <span>Avg: <strong className="text-white">{q.numericAvg?.toFixed(2)}</strong></span>
                            <span>Min: <strong className="text-white">{q.numericMin}</strong></span>
                            <span>Max: <strong className="text-white">{q.numericMax}</strong></span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ── Main Module ───────────────────────────────────────────────────────────────

export const SurveysModule: React.FC = () => {
    const {
        surveys,
        fetchSurveys,
        createSurvey,
        updateSurvey
    } = useSurveysStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [formTab, setFormTab] = useState<'questions' | 'results'>('questions');

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
        setFormTab('questions');
        setCurrentView('form');
    };

    const handleRowClick = (record: Survey) => {
        setActiveRecord(record);
        setFormData(record);
        setFormTab('questions');
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
                        <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
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
                        <h3 className="text-2xl font-bold text-white">{totalResponses}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Total Questions</p>
                        <h3 className="text-2xl font-bold text-white">{totalQuestions}</h3>
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
                        {activeRecord && (
                            <a
                                href={`/portal/surveys/${(activeRecord as any).accessToken ?? activeRecord.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-blue-500/30"
                            >
                                Test / View
                            </a>
                        )}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-500 transition-all w-full"
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
                            className="w-full h-28 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white text-sm outline-none focus:border-primary-500 transition-all resize-none"
                            placeholder="Add survey instructions or details..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-white/60 text-sm font-medium">Scoring Options</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-500 transition-all"
                            value={formData.scoringType || 'no_scoring'}
                            onChange={(e) => setFormData({ ...formData, scoringType: e.target.value })}
                        >
                            <option value="no_scoring" className="bg-gray-900">No Scoring</option>
                            <option value="scoring_with_answers" className="bg-gray-900">Scoring with Answers</option>
                            <option value="scoring_without_answers" className="bg-gray-900">Scoring without Answers</option>
                        </select>
                    </div>

                    {/* Tabs: Questions / Results */}
                    <div>
                        <div className="flex gap-1 border-b border-white/10 mb-4">
                            {(['questions', 'results'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFormTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${formTab === tab
                                        ? 'border-primary-500 text-white'
                                        : 'border-transparent text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    {tab === 'questions' ? (
                                        <span className="flex items-center gap-1.5"><Edit className="w-3.5 h-3.5" /> Questions</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Results</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {formTab === 'questions' && activeRecord && (
                            <QuestionBuilder surveyId={activeRecord.id} />
                        )}
                        {formTab === 'questions' && !activeRecord && (
                            <div className="text-white/40 text-sm">Save the survey first to add questions.</div>
                        )}
                        {formTab === 'results' && activeRecord && (
                            <ResultsTab surveyId={activeRecord.id} />
                        )}
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
