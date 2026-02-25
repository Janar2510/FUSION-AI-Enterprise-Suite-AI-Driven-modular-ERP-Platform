import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { OdooKanbanBase } from '@/components/views/OdooKanbanBase';
import { useProjectStore, ProjectProject, ProjectTask } from '../stores/projectStore';
import { Clock } from 'lucide-react';

export const ProjectModule: React.FC = () => {
    const {
        projects,
        tasks,
        stages,
        fetchProjects,
        fetchStages,
        fetchTasks,
        createProject,
        updateProject,
        createTask,
        updateTaskStage
    } = useProjectStore();

    const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
    const [currentView, setCurrentView] = useState<ViewType>('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Specific view states
    const [activeProject, setActiveProject] = useState<ProjectProject | null>(null);
    const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

    const [projectFormData, setProjectFormData] = useState<Partial<ProjectProject>>({});
    const [taskFormData, setTaskFormData] = useState<Partial<ProjectTask>>({});

    useEffect(() => {
        fetchProjects();
        fetchStages();
    }, []);

    // When tab changes, load appropriate data
    useEffect(() => {
        if (activeTab === 'tasks') {
            // We load tasks for the first project as a default if none selected, or all tasks if backend supported it easily
            // For now, if we are in 'tasks' tab globally, we might want to fetch all tasks. The endpoint /api/projects/:id/tasks requires an ID.
            // So if activeProject is selected, use it. If not, maybe we just show nothing or select first project.
            if (activeProject) {
                fetchTasks(activeProject.id);
            } else if (projects.length > 0) {
                setActiveProject(projects[0]);
                fetchTasks(projects[0].id);
            }
        }
    }, [activeTab, activeProject, projects]);

    const handleNew = () => {
        if (activeTab === 'projects') {
            setActiveProject(null);
            setProjectFormData({
                active: true,
                color: 0,
                taskCount: 0
            });
        } else {
            setActiveTask(null);
            setTaskFormData({
                active: true,
                projectId: activeProject?.id,
                stageId: stages.length > 0 ? stages[0].id : undefined,
                priority: 0,
                sequence: 10,
                kanbanState: 'normal'
            });
        }
        setCurrentView('form');
    };

    const handleRowClick = (record: any) => {
        if (activeTab === 'projects') {
            setActiveProject(record);
            setProjectFormData(record);
        } else {
            setActiveTask(record);
            setTaskFormData(record);
        }
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeTab === 'projects') {
            if (activeProject) {
                await updateProject(activeProject.id, projectFormData);
            } else {
                const newProj = await createProject(projectFormData);
                if (newProj) setActiveProject(newProj);
            }
        } else {
            if (activeTask) {
                // Edit task logic not fully implemented in store yet, skip for now.
            } else {
                if (taskFormData.projectId) {
                    const newTask = await createTask(taskFormData.projectId, taskFormData);
                    if (newTask) setActiveTask(newTask);
                }
            }
        }
        setCurrentView('list');
    };

    const handleTaskStageChange = async (taskId: string, newStageId: string) => {
        if (activeProject) {
            await updateTaskStage(parseInt(taskId), parseInt(newStageId), activeProject.id);
        }
    };

    // --------------------------------------------------------------------------
    // PROJECTS VIEW
    // --------------------------------------------------------------------------
    const renderProjectsList = () => (
        <OdooListBase
            data={projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(p) => p.id.toString()}
            columns={[
                { key: 'name', label: 'Project Name', render: (p) => <span className="font-bold">{p.name}</span> },
                { key: 'tasks', label: 'Tasks Count', render: (p) => p._count?.tasks || 0 },
                { key: 'dateStart', label: 'Start Date', render: (p) => p.dateStart ? new Date(p.dateStart).toLocaleDateString() : '' },
                { key: 'date', label: 'Deadline', render: (p) => p.date ? new Date(p.date).toLocaleDateString() : '' },
            ]}
        />
    );

    const renderProjectForm = () => (
        <OdooFormBase
            statusRibbon={<div className="h-4"></div>}
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Project Name"
                        value={projectFormData.name || ''}
                        onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={projectFormData.dateStart?.split('T')[0] || ''}
                                onChange={(e) => setProjectFormData({ ...projectFormData, dateStart: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Deadline</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={projectFormData.date?.split('T')[0] || ''}
                                onChange={(e) => setProjectFormData({ ...projectFormData, date: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-white/60 text-sm font-medium">Description</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all h-32"
                                placeholder="Project description..."
                                value={projectFormData.description || ''}
                                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            }
        />
    );

    // --------------------------------------------------------------------------
    // TASKS VIEW
    // --------------------------------------------------------------------------
    const renderTasksKanban = () => {
        const columns = stages.map(st => ({
            id: st.id.toString(),
            title: st.name,
            items: tasks.filter(t => t.stageId === st.id && t.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }));

        return (
            <OdooKanbanBase
                columns={columns}
                onDragEnd={(result) => {
                    if (!result.destination) return;
                    handleTaskStageChange(result.draggableId, result.destination.droppableId);
                }}
                keyExtractor={(t) => t.id.toString()}
                renderCard={(t) => (
                    <div className="space-y-3 cursor-pointer" onClick={() => handleRowClick(t)}>
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-white/90 leading-tight">{t.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            {t.dateDeadline && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(t.dateDeadline).toLocaleDateString()}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full ${t.priority > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
                                Priority: {t.priority > 0 ? 'High' : 'Normal'}
                            </span>
                        </div>
                    </div>
                )}
            />
        );
    };

    const renderTasksList = () => (
        <OdooListBase
            data={tasks.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Task Title', render: (t) => <span className="font-bold">{t.name}</span> },
                { key: 'project', label: 'Project', render: () => activeProject?.name || '' },
                { key: 'stage', label: 'Stage', render: (t) => t.stage?.name || '' },
                { key: 'deadline', label: 'Deadline', render: (t) => t.dateDeadline ? new Date(t.dateDeadline).toLocaleDateString() : '' },
            ]}
        />
    );

    const renderTaskForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex gap-2"></div>
                    <div className="flex text-sm font-medium">
                        {stages.map((stage) => (
                            <button
                                key={stage.id}
                                onClick={() => {
                                    setTaskFormData({ ...taskFormData, stageId: stage.id });
                                    if (activeTask) handleTaskStageChange(activeTask.id.toString(), stage.id.toString());
                                }}
                                className={`px-4 py-2 flex items-center border-l border-white/10 uppercase transition-colors
                        ${taskFormData.stageId === stage.id ? 'text-primary-purple font-bold bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}
                        `}
                            >
                                {stage.name}
                            </button>
                        ))}
                    </div>
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-transparent placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full"
                        placeholder="Task Title"
                        value={taskFormData.name || ''}
                        onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                    />
                    <h3 className="text-xl text-white/50">{activeProject?.name || ''}</h3>
                </div>
            }
            leftPanels={
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Project</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={taskFormData.projectId || ''}
                                onChange={(e) => setTaskFormData({ ...taskFormData, projectId: parseInt(e.target.value) })}
                            >
                                <option value="" className="text-black">Select...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/60 text-sm font-medium">Deadline</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all"
                                value={taskFormData.dateDeadline?.split('T')[0] || ''}
                                onChange={(e) => setTaskFormData({ ...taskFormData, dateDeadline: new Date(e.target.value).toISOString() })}
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-white/60 text-sm font-medium">Description</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-primary-purple transition-all h-32"
                                placeholder="Task description..."
                                value={taskFormData.description || ''}
                                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            }
        />
    );

    return (
        <OdooViewManager
            title={activeTab === 'projects' ? 'Projects' : 'Tasks'}
            currentView={currentView}
            onViewChange={setCurrentView}
            onNew={handleNew}
            onSave={handleSave}
            onDiscard={() => setCurrentView('list')}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewsAvailable={activeTab === 'tasks' ? ['kanban', 'list', 'form'] : ['list', 'form']}
        >
            <div className="flex gap-4 border-b border-white/10 mb-6 px-4">
                {[
                    { id: 'projects', label: 'Projects' },
                    { id: 'tasks', label: 'Tasks' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary-purple text-primary-purple' : 'border-transparent text-white/60 hover:text-white'
                            }`}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            setCurrentView('list');
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* When in Tasks tab, show a project selector so user can filter tasks easily */}
            {activeTab === 'tasks' && currentView !== 'form' && (
                <div className="mb-4 px-4 flex items-center gap-3">
                    <span className="text-white/60 font-medium">Active Project:</span>
                    <select
                        className="bg-white/10 border border-white/20 rounded-md px-3 py-1 text-white outline-none focus:border-primary-purple"
                        value={activeProject?.id || ''}
                        onChange={(e) => {
                            const p = projects.find(proj => proj.id === parseInt(e.target.value));
                            if (p) {
                                setActiveProject(p);
                                fetchTasks(p.id);
                            }
                        }}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {currentView === 'list' && (activeTab === 'projects' ? renderProjectsList() : renderTasksList())}
            {currentView === 'kanban' && activeTab === 'tasks' && renderTasksKanban()}
            {currentView === 'form' && (activeTab === 'projects' ? renderProjectForm() : renderTaskForm())}
        </OdooViewManager>
    );
};
