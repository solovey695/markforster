import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { KanbanColumn as KanbanColumnType, Task } from '../types';
import TaskItem from './TaskItem';

type AppData = ReturnType<typeof useAppData>;

interface KanbanViewProps {
    appData: AppData;
    onFocusTask: (task: Task) => void;
    onProbeTask: (task: Task) => void;
}

const EmptyColumnState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] p-4 border-2 border-dashed border-[var(--glass-border)] rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--accent-soft)]/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">Перетащите задачи сюда</p>
    </div>
);


const KanbanColumn: React.FC<{
    column: KanbanColumnType;
    tasks: Task[];
    appData: AppData;
    activeCard: { columnId: string; taskId: string } | null;
    setActiveCard: (card: { columnId: string; taskId: string } | null) => void;
    onDragStart: (e: React.DragEvent, task: Task) => void;
    onDropInColumn: (destColumnId: string, destIndex: number) => void;
    onDragOverColumn: (e: React.DragEvent, columnId: string) => void;
    isDragging: boolean;
    draggedTask: Task | null;
    onFocusTask: (task: Task) => void;
    onStartDistillation: (task: Task) => void;
}> = ({ column, tasks, appData, activeCard, setActiveCard, onDragStart, onDropInColumn, onDragOverColumn, isDragging, draggedTask, onFocusTask, onStartDistillation }) => {
    const { state, handlers, derivedState } = appData;
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(column.title);
    const [newTaskText, setNewTaskText] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const cardsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing) {
            titleInputRef.current?.focus();
        }
    }, [isEditing]);
    
    useEffect(() => {
        if (activeCard?.columnId === column.id) {
            const cardElement = cardsContainerRef.current?.querySelector(`[data-task-id="${activeCard.taskId}"]`);
            cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeCard, column.id]);


    const handleTitleChange = () => {
        if (title.trim() && title.trim() !== column.title) {
            handlers.handleUpdateKanbanColumn(column.id, title);
        } else {
            setTitle(column.title);
        }
        setIsEditing(false);
    };
    
    const handleAddTask = () => {
        if (newTaskText.trim()) {
            handlers.handleAddTask(newTaskText, column.id);
            setNewTaskText('');
        }
    };
    
    const columnTasks = useMemo(() => 
        tasks
            .filter(t => t.kanbanColumnId === column.id && !t.hidden && !t.completed)
            .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0)),
        [tasks, column.id]
    );

    const getDropIndex = (e: React.DragEvent): number => {
        const container = cardsContainerRef.current;
        if (!container) return columnTasks.length;

        const cards = Array.from(container.querySelectorAll('[data-task-id]'));
        const { clientY } = e;

        const cardAfter = cards.find(card => {
            const { top, height } = (card as HTMLElement).getBoundingClientRect();
            return clientY < top + height / 2;
        });

        if (cardAfter) {
            const id = (cardAfter as HTMLElement).getAttribute('data-task-id');
            return columnTasks.findIndex(t => t.id === id);
        }
        
        return columnTasks.length;
    };
    
    const handleLocalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        onDragOverColumn(e, column.id);
    };

    const handleLocalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const destIndex = getDropIndex(e);
        onDropInColumn(column.id, destIndex);
    };

    return (
        <div
            className="kanban-column"
            onDragOver={handleLocalDragOver}
            onDrop={handleLocalDrop}
            onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
        >
            <div className="kanban-column-header">
                {isEditing ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleTitleChange}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleTitleChange();
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                        className="bg-transparent text-base font-semibold w-full outline-none ring-1 ring-[var(--accent-neon)] rounded px-1 -mx-1"
                    />
                ) : (
                    <h3 onClick={() => setIsEditing(true)} className="flex-grow">{title} ({columnTasks.length})</h3>
                )}
                 <button onClick={() => handlers.handleDeleteKanbanColumn(column.id)} className="text-[var(--text-secondary)] hover:text-[var(--undone)] text-lg ml-2">&times;</button>
            </div>
            <div ref={cardsContainerRef} className="kanban-cards">
                {columnTasks.length > 0 ? columnTasks.map((task, index) => (
                    <TaskItem
                        key={task.id}
                        item={task}
                        index={index}
                        tasks={tasks}
                        activeTaskId={activeCard?.taskId === task.id ? task.id : null}
                        currentTab="kanban"
                        activeTagFilter={state.activeTagFilter}
                        isDraggable={true}
                        taskSystemVersion={state.taskSystemVersion}
                        allTags={derivedState.allTags}
                        v3ActiveTaskIds={state.v3ActiveTaskIds}
                        v5ScanIndex={state.v5ScanIndex}
                        onTagClick={(tag) => handlers.setActiveTagFilter(state.activeTagFilter === tag ? null : tag)}
                        setActiveTaskId={(id) => setActiveCard(id ? { columnId: column.id, taskId: id } : null)}
                        handleToggleComplete={handlers.handleToggleComplete}
                        handleDeleteTask={handlers.handleDeleteTask}
                        handleUndoTask={handlers.handleUndoTask}
                        handleStarTask={handlers.handleStarTask}
                        handleRepeatTask={handlers.handleRepeatTask}
                        handleUpdateTaskText={handlers.handleUpdateTaskText}
                        handleUpdateTaskNote={handlers.handleUpdateTaskNote}
                        handleAddSubtask={handlers.handleAddSubtask}
                        handleAddTag={handlers.handleAddTag}
                        handleRemoveTag={handlers.handleRemoveTag}
                        handleEnterTask={handlers.setCurrentParentTask}
                        handleToggleCollapse={handlers.handleToggleCollapse}
                        handleTogglePriorityDetails={handlers.handleTogglePriorityDetails}
                        handleUpdatePriorityDetail={handlers.handleUpdatePriorityDetail}
                        handleBrainstormTimerToggle={handlers.handleBrainstormTimerToggle}
                        onV3SelectTask={handlers.handleV3SelectTask}
                        handleV7MarkUnfinished={handlers.handleV7MarkUnfinished}
                        handleV7MarkRecurring={handlers.handleV7MarkRecurring}
                        onFocusTask={onFocusTask}
                        onStartDistillation={onStartDistillation}
                        onDragStart={(e, item) => onDragStart(e, item as Task)}
                        onDragOver={() => {}}
                        onDrop={() => {}}
                    />
                )) : (
                    !isDragging && <EmptyColumnState />
                )}
                {isDragging && draggedTask?.kanbanColumnId !== column.id && columnTasks.length === 0 && (
                    <div className="kanban-card opacity-50 bg-[var(--glass-bg)] border-2 border-dashed border-[var(--glass-border)] h-24" />
                )}
            </div>
            <div className="p-2 mt-auto border-t border-[var(--glass-border)]">
                 <textarea
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(); } }}
                    placeholder="+ Новая карточка"
                    className="w-full bg-transparent text-sm p-1 outline-none border border-transparent focus:border-[var(--glass-border)] transition-colors rounded resize-none"
                    rows={2}
                />
            </div>
        </div>
    );
};

const KanbanView: React.FC<KanbanViewProps> = ({ appData, onFocusTask, onProbeTask }) => {
    const { state, handlers } = appData;
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [activeCard, setActiveCard] = useState<{ columnId: string; taskId: string } | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const handleAddColumn = () => {
        if (newColumnTitle.trim()) {
            handlers.handleAddKanbanColumn(newColumnTitle);
            setNewColumnTitle('');
            setIsAddingColumn(false);
        }
    };
    
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        setDraggedTask(task);
        (e.currentTarget as HTMLElement).classList.add('dragging');
    };
    
    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        setDraggedTask(null);
    };

    const handleDrop = (destColumnId: string, destIndex: number) => {
        if (!draggedTask) return;
        handlers.handleMoveTaskInKanban(
            draggedTask.id,
            draggedTask.kanbanColumnId || '',
            destColumnId,
            destIndex
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!activeCard) {
            if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && state.kanbanBoard.columns.length > 0) {
                const firstColId = state.kanbanBoard.columns[0].id;
                const tasksInFirstCol = state.tasks.filter(t => t.kanbanColumnId === firstColId && !t.hidden && !t.completed).sort((a,b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
                if (tasksInFirstCol.length > 0) {
                    setActiveCard({ columnId: firstColId, taskId: tasksInFirstCol[0].id });
                }
            }
            return;
        }

        const { columnId, taskId } = activeCard;
        const currentColumnIndex = state.kanbanBoard.columns.findIndex(c => c.id === columnId);
        const currentColumn = state.kanbanBoard.columns[currentColumnIndex];
        const tasksInCurrentColumn = state.tasks
            .filter(t => t.kanbanColumnId === columnId && !t.hidden && !t.completed)
            .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
        const currentTaskIndex = tasksInCurrentColumn.findIndex(t => t.id === taskId);

        switch (e.key) {
            case 'ArrowDown':
                if (currentTaskIndex < tasksInCurrentColumn.length - 1) {
                    setActiveCard({ columnId, taskId: tasksInCurrentColumn[currentTaskIndex + 1].id });
                }
                break;
            case 'ArrowUp':
                if (currentTaskIndex > 0) {
                    setActiveCard({ columnId, taskId: tasksInCurrentColumn[currentTaskIndex - 1].id });
                }
                break;
            case 'ArrowRight':
                if (currentColumnIndex < state.kanbanBoard.columns.length - 1) {
                    const nextColumn = state.kanbanBoard.columns[currentColumnIndex + 1];
                    const tasksInNextCol = state.tasks.filter(t => t.kanbanColumnId === nextColumn.id && !t.hidden && !t.completed).sort((a,b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
                    if (tasksInNextCol.length > 0) {
                        const targetIndex = Math.min(currentTaskIndex, tasksInNextCol.length - 1);
                        setActiveCard({ columnId: nextColumn.id, taskId: tasksInNextCol[targetIndex].id });
                    }
                }
                break;
            case 'ArrowLeft':
                if (currentColumnIndex > 0) {
                    const prevColumn = state.kanbanBoard.columns[currentColumnIndex - 1];
                    const tasksInPrevCol = state.tasks.filter(t => t.kanbanColumnId === prevColumn.id && !t.hidden && !t.completed).sort((a,b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
                    if (tasksInPrevCol.length > 0) {
                        const targetIndex = Math.min(currentTaskIndex, tasksInPrevCol.length - 1);
                        setActiveCard({ columnId: prevColumn.id, taskId: tasksInPrevCol[targetIndex].id });
                    }
                }
                break;
            case 'Escape':
                setActiveCard(null);
                (e.target as HTMLElement).blur();
                break;
        }
    };
    
    const onDragOverColumn = (e: React.DragEvent, columnId: string) => {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        const columnEl = e.currentTarget as HTMLElement;
        columnEl.classList.add('drag-over');

        const container = columnEl.querySelector('.kanban-cards');
        if (!container) return;

        // remove existing placeholders
        container.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
        
        const cards = Array.from(container.querySelectorAll('[data-task-id]'));
        const { clientY } = e;

        let insertBefore: Element | null = null;
        for (const card of cards) {
            const { top, height } = card.getBoundingClientRect();
            if (clientY < top + height / 2) {
                insertBefore = card;
                break;
            }
        }

        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder kanban-card opacity-50 bg-[var(--glass-bg)] border-2 border-dashed border-[var(--glass-border)]';
        placeholder.style.height = draggedTask ? `${(document.querySelector(`[data-task-id="${draggedTask.id}"]`) as HTMLElement)?.offsetHeight}px` : '60px';

        if (insertBefore) {
            container.insertBefore(placeholder, insertBefore);
        } else {
            container.appendChild(placeholder);
        }
    };
    
    const onDragEndCleanup = (e: React.DragEvent) => {
        handleDragEnd(e);
        document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
    };

    return (
        <div className="h-full" onKeyDown={handleKeyDown} onDragEnd={onDragEndCleanup} tabIndex={-1}>
            <div className="kanban-board">
                {state.kanbanBoard.columns.map(column => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={state.tasks}
                        appData={appData}
                        activeCard={activeCard}
                        setActiveCard={setActiveCard}
                        onDragStart={handleDragStart}
                        onDropInColumn={handleDrop}
                        onDragOverColumn={onDragOverColumn}
                        isDragging={!!draggedTask}
                        draggedTask={draggedTask}
                        onFocusTask={onFocusTask}
                        onStartDistillation={onProbeTask}
                    />
                ))}
                <div className="flex-shrink-0 w-80">
                    {isAddingColumn ? (
                        <div className="p-2 bg-[var(--glass-bg)] rounded-lg">
                            <input
                                type="text"
                                value={newColumnTitle}
                                onChange={e => setNewColumnTitle(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddColumn();
                                    if (e.key === 'Escape') setIsAddingColumn(false);
                                }}
                                placeholder="Название колонки..."
                                className="w-full bg-black/20 p-2 rounded outline-none ring-1 ring-[var(--accent-neon)] text-sm"
                                autoFocus
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={handleAddColumn} className="px-3 py-1 bg-[var(--accent-soft)] text-black text-sm rounded">Добавить</button>
                                <button onClick={() => setIsAddingColumn(false)} className="text-xl text-[var(--text-secondary)]">&times;</button>
                            </div>
                        </div>
                    ) : (
                         <button
                            onClick={() => setIsAddingColumn(true)}
                            className="w-full p-3 rounded-lg bg-[var(--glass-bg)]/50 hover:bg-[var(--glass-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                        >
                            + Добавить колонку
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanView;