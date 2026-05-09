import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooListBase } from '@/components/views/OdooListBase';
import { OdooFormBase } from '@/components/views/OdooFormBase';
import { useNotesStore, Note } from '../stores/notesStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const STAGES = [
    { id: 'new', label: 'To Do' },
    { id: 'in_progress', label: 'Doing' },
    { id: 'done', label: 'Done' }
] as const;

const COLOR_PALETTE = [
    '',              // 0 — no color
    '#e11d48',       // 1 — red
    '#f97316',       // 2 — orange
    '#eab308',       // 3 — yellow
    '#22c55e',       // 4 — green
    '#06b6d4',       // 5 — cyan
    '#3b82f6',       // 6 — blue
    '#8b5cf6',       // 7 — violet
    '#ec4899',       // 8 — pink
    '#6366f1',       // 9 — indigo
    '#14b8a6',       // 10 — teal
    '#64748b',       // 11 — slate
];

export const NotesModule: React.FC = () => {
    const {
        notes,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote
    } = useNotesStore();

    const [currentView, setCurrentView] = useState<ViewType>('kanban');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRecord, setActiveRecord] = useState<Note | null>(null);
    const [formData, setFormData] = useState<Partial<Note>>({
        stage: 'new',
        color: 0
    });

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleNew = () => {
        setActiveRecord(null);
        setFormData({
            stage: 'new',
            color: 0,
            name: 'New Note'
        });
        setCurrentView('form');
    };

    const handleRowClick = (record: Note) => {
        setActiveRecord(record);
        setFormData(record);
        setCurrentView('form');
    };

    const handleSave = async () => {
        if (activeRecord) {
            await updateNote(activeRecord.id, formData);
        } else {
            const n = await createNote(formData);
            if (n) setActiveRecord(n);
        }
        setCurrentView('kanban');
    };

    const handleDelete = async () => {
        if (!activeRecord) return;
        if (window.confirm("Are you sure you want to delete this note?")) {
            await deleteNote(activeRecord.id);
            setCurrentView('kanban');
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const noteId = parseInt(draggableId);
        const newStage = destination.droppableId;
        await updateNote(noteId, { stage: newStage });
    };

    const filteredNotes = notes.filter(n => n.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const renderKanban = () => (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-[calc(100vh-180px)] overflow-x-auto pb-4 pt-4">
                {STAGES.map(stage => {
                    const stageNotes = filteredNotes.filter(n => n.stage === stage.id).sort((a, b) => a.sequence - b.sequence);
                    return (
                        <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col bg-black/20 rounded-xl p-4 border border-white/5">
                            <h3 className="text-white font-medium mb-4 flex items-center justify-between">
                                {stage.label}
                                <span className="bg-white/10 text-white/70 text-xs py-0.5 px-2 rounded-full">
                                    {stageNotes.length}
                                </span>
                            </h3>

                            <Droppable droppableId={stage.id}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
                                        {stageNotes.map((note, index) => (
                                            <Draggable key={note.id.toString()} draggableId={note.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => handleRowClick(note)}
                                                        className={`bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all overflow-hidden ${snapshot.isDragging ? 'shadow-2xl shadow-primary-purple/20 ring-1 ring-primary-purple' : ''
                                                            }`}
                                                    >
                                                        {note.color > 0 && (
                                                            <div style={{ backgroundColor: COLOR_PALETTE[note.color] ?? '' }} className="h-1 w-full" />
                                                        )}
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <h4 className="text-white font-medium line-clamp-2">{note.name}</h4>
                                                            </div>
                                                            {note.body && (
                                                                <div className="text-xs text-white/50 line-clamp-3 overflow-hidden text-ellipsis mb-2">
                                                                    {note.body.replace(/<[^>]+>/g, '')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );

    const renderList = () => (
        <OdooListBase
            data={filteredNotes}
            onRowClick={handleRowClick}
            keyExtractor={(t) => t.id.toString()}
            columns={[
                { key: 'name', label: 'Subject', render: (t) => <span className="font-bold">{t.name}</span> },
                {
                    key: 'stage', label: 'Stage', render: (t) => (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase
                        ${t.stage === 'done' ? 'bg-green-500/20 text-green-400' :
                                t.stage === 'new' ? 'bg-white/10 text-white/60' :
                                    'bg-blue-500/20 text-blue-400'}
                    `}>
                            {t.stage.replace('_', ' ')}
                        </span>
                    )
                },
            ]}
        />
    );

    const renderForm = () => (
        <OdooFormBase
            statusRibbon={
                <div className="flex items-center justify-between w-full">
                    <div className="flex space-x-2">
                        {STAGES.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setFormData({ ...formData, stage: s.id });
                                    if (activeRecord) updateNote(activeRecord.id, { stage: s.id });
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.stage === s.id
                                        ? 'bg-primary-purple text-white shadow-lg'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    {/* Color picker */}
                    <div className="flex items-center gap-1 ml-2">
                        {COLOR_PALETTE.map((color, idx) => (
                            <button
                                key={idx}
                                title={idx === 0 ? 'No color' : `Color ${idx}`}
                                onClick={() => setFormData({ ...formData, color: idx })}
                                style={{ backgroundColor: color || 'transparent' }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${formData.color === idx ? 'border-white scale-110' : 'border-white/20'} ${idx === 0 ? 'bg-white/10' : ''}`}
                            />
                        ))}
                    </div>
                    {activeRecord && (
                        <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-sm transition-colors border border-red-500/30">
                            Delete Note
                        </button>
                    )}
                </div>
            }
            headerContent={
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="text-4xl font-bold bg-transparent text-white border-b border-white/20 placeholder-white/30 outline-none focus:border-primary-purple transition-all w-full pb-2 mb-4"
                        placeholder="Note Title..."
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            }
            leftPanels={
                <div className="space-y-6 w-full max-w-4xl col-span-2 lg:col-span-2">
                    <div className="space-y-2">
                        <textarea
                            className="w-full h-[500px] bg-white/5 border border-white/10 rounded-xl p-6 text-white outline-none focus:border-primary-purple transition-all resize-none font-mono text-sm leading-relaxed"
                            placeholder="Write your note down here. Use markdown or plain text."
                            value={formData.body || ''}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>
                </div>
            }
            rightPanels={null}
        />
    );

    return (
        <OdooViewManager
            title="Notes"
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
            {currentView === 'list' && renderList()}
            {currentView === 'form' && renderForm()}
        </OdooViewManager>
    );
};
