import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DroppableProps, Draggable, DropResult } from 'react-beautiful-dnd';
import { GlassCard } from '@/components/shared/GlassCard';
import { Plus } from 'lucide-react';

// StrictMode workaround for react-beautiful-dnd in React 18
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) {
        return null;
    }

    return <Droppable {...props}>{children}</Droppable>;
};

export interface KanbanColumn<T> {
    id: string;
    title: string;
    items: T[];
    headerExtra?: React.ReactNode;
}

interface OdooKanbanBaseProps<T> {
    columns: KanbanColumn<T>[];
    onDragEnd: (result: DropResult) => void;
    renderCard: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string;
    onColumnAdd?: () => void;
    onCardAdd?: (columnId: string) => void;
}

export function OdooKanbanBase<T>({
    columns,
    onDragEnd,
    renderCard,
    keyExtractor,
    onColumnAdd,
    onCardAdd
}: OdooKanbanBaseProps<T>) {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto overflow-y-hidden pb-4 items-start w-full">
                {columns.map((column) => (
                    <div key={column.id} className="flex flex-col w-[320px] shrink-0 max-h-full">
                        {/* Column Header */}
                        <div className="flex flex-col mb-4 px-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-medium">{column.title}</h3>
                                    <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">
                                        {column.items.length}
                                    </span>
                                </div>
                                {onCardAdd && (
                                    <button
                                        onClick={() => onCardAdd(column.id)}
                                        className="text-white/40 hover:text-white transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {column.headerExtra && (
                                <div className="mt-1">
                                    {column.headerExtra}
                                </div>
                            )}
                        </div>

                        {/* Droppable Area */}
                        <StrictModeDroppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto min-h-[150px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''
                                        }`}
                                >
                                    {column.items.map((item, index) => (
                                        <Draggable
                                            key={keyExtractor(item)}
                                            draggableId={keyExtractor(item)}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`mb-4 ${snapshot.isDragging ? 'z-50' : ''}`}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                    }}
                                                >
                                                    <GlassCard
                                                        className={`p-4 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-2xl shadow-black/50 ring-1 ring-white/20' : 'hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {renderCard(item)}
                                                    </GlassCard>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </StrictModeDroppable>
                    </div>
                ))}

                {/* Add Column Button */}
                {onColumnAdd && (
                    <button
                        onClick={onColumnAdd}
                        className="w-80 shrink-0 mt-8 h-12 rounded-xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" /> Add Column
                    </button>
                )}
            </div>
        </DragDropContext>
    );
}
