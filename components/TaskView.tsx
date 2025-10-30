import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// FIX: Import `Context` type to resolve type inference issue.
import { Task, Subtask, Tab, Context } from '../types';
import { useAppData } from '../hooks/useAppData';
import TaskItem from './TaskItem';
import ContextFilter from './ContextFilter';
import QuickAddTask from './QuickAddTask';
import { getDateString } from '../utils';

type AppData = ReturnType<typeof useAppData>;

interface TaskViewProps {
    appData: AppData;
    currentTab: Tab;
    isFocusMode: boolean;
    onTabChange?: (tab: Tab) => void;
    onViewSaved?: () => void;
    onFocusTask: (task: Task) => void;
    onProbeTask: (task: Task) => void;
}

const TASKS_PER_PAGE = 20;
const V4_TASKS_PER_PAGE = 25;

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[var(--accent-soft)]/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-[var(--text-color)]">Всё сделано!</h3>
        <p>Ваш список задач пуст. Добавьте новую, чтобы начать.</p>
    </div>
);


const TaskView: React.FC<TaskViewProps> = ({ appData, currentTab, isFocusMode, onTabChange, onViewSaved, onFocusTask, onProbeTask }) => {
    const [draggedItem, setDraggedItem] = useState<Task | Subtask | null>(null);
    const [dragOverItem, setDragOverItem] = useState<Task | Subtask | null>(null);
    const [v7ActiveList, setV7ActiveList] = useState<'main' | 'recurring' | 'unfinished'>('main');
    
    const { state, handlers, derivedState } = appData;
    const { taskSystemVersion } = state;
    const isInitialMount = useRef(true);

    const handleTagClick = useCallback((tag: string) => {
        handlers.setActiveTagFilter(state.activeTagFilter === tag ? null : tag);
    }, [state.activeTagFilter, handlers]);

    // Step 1: Memoize the expensive filtering and sorting logic.
    // This produces the complete, sorted, unpaginated list of tasks based on all filters.
    const allSortedTasks = useMemo(() => {
        if (state.currentParentTask) {
            const parent = state.tasks.find(t => t.id === state.currentParentTask!.id);
            return parent?.subtasks || [];
        }
        
        let baseTasks: Task[] = [];
        if (currentTab === 'tasks') {
            baseTasks = state.tasks.filter(t => !t.parentId);
        } else if (currentTab === 'projects') {
            baseTasks = state.tasks.filter(t => !t.hidden && !t.parentId && t.text.match(/\[P:.*\]/));
        }

        const matchesContexts = (task: Task): boolean => {
            if (state.activeContextIds.length === 0 && state.excludedContextIds.length === 0) return true;
            const taskTags = new Set(task.tags.split(' ').filter(Boolean));
            const contextMap = new Map<string, Context>(state.contexts.map(c => [c.id, c]));
            const doesTaskMatchContext = (contextId: string): boolean => {
                const context = contextMap.get(contextId);
                if (!context) return false;
                return context.tags.every(tag => taskTags.has(tag));
            };
            if (state.excludedContextIds.some(id => doesTaskMatchContext(id))) return false;
            if (state.activeContextIds.length === 0) return true;
            if (state.contextLogic === 'AND') return state.activeContextIds.every(id => doesTaskMatchContext(id));
            else return state.activeContextIds.some(id => doesTaskMatchContext(id));
        };

        let filteredTasks = baseTasks.filter((task: Task) => {
            const matchesTag = !state.activeTagFilter || task.tags?.includes(state.activeTagFilter);
            const matchesSearch = !state.searchQuery || task.text.toLowerCase().includes(state.searchQuery.toLowerCase());
            const matchesContext = matchesContexts(task);
            return !task.hidden && matchesTag && matchesSearch && matchesContext;
        });

        if (state.isFilteringByNoNextAction && currentTab === 'projects') {
             filteredTasks = filteredTasks.filter(p => {
                if (p.completed) return false;
                const projectTagMatch = p.text.match(/\[P:.*\]/);
                if (!projectTagMatch) return false;
                const tagStartIndex = p.text.indexOf(projectTagMatch[0]);
                const textBeforeTag = p.text.substring(0, tagStartIndex);
                return textBeforeTag.trim() === '';
            });
        }
        
        let sortedAndProcessedTasks: Task[] = [];

        switch (taskSystemVersion) {
            case 1:
            case 2: {
                const tasksPerPage = TASKS_PER_PAGE;
                
                // 1. Sort by originalIndex to establish a baseline order
                const baseSorted = [...filteredTasks].sort((a, b) => a.originalIndex - b.originalIndex);

                // 2. Map to an intermediate structure with rank and page number
                const rankedTasks = baseSorted.map((task, index) => ({
                    task,
                    rank: index,
                    page: Math.floor(index / tasksPerPage)
                }));
                
                // 3. Sort the ranked tasks using the new logic
                rankedTasks.sort((a, b) => {
                    // Primary sort: page number. This keeps tasks on their original page.
                    if (a.page !== b.page) {
                        return a.page - b.page;
                    }

                    // Secondary sort: starred status
                    const aIsStarred = a.task.starCount > 0 && !a.task.completed && !a.task.undone;
                    const bIsStarred = b.task.starCount > 0 && !b.task.completed && !b.task.undone;
                    if (aIsStarred && !bIsStarred) return -1;
                    if (!aIsStarred && bIsStarred) return 1;

                    // Tertiary sort: starred timestamp
                    if (aIsStarred && bIsStarred) {
                        return (a.task.starredAt ? new Date(a.task.starredAt).getTime() : 0) - (b.task.starredAt ? new Date(b.task.starredAt).getTime() : 0);
                    }

                    // Final sort: original rank for stability
                    return a.rank - b.rank;
                });

                // 4. Map back to the original task structure
                sortedAndProcessedTasks = rankedTasks.map(item => item.task);
                break;
            }
            case 3:
                if (state.v3ActiveTaskIds.length === 3) {
                    sortedAndProcessedTasks = filteredTasks
                        .filter(t => state.v3ActiveTaskIds.includes(t.id))
                        .sort((a, b) => state.v3ActiveTaskIds.indexOf(a.id) - state.v3ActiveTaskIds.indexOf(b.id));
                } else {
                    sortedAndProcessedTasks = filteredTasks.filter(t => !t.completed);
                }
                break;
            case 4:
                sortedAndProcessedTasks = filteredTasks.filter(t => !t.completed && !t.undone).sort((a, b) => a.originalIndex - b.originalIndex);
                break;
            case 5:
                sortedAndProcessedTasks = filteredTasks
                    .filter(t => !t.completed && !t.undone)
                    .sort((a, b) => b.originalIndex - a.originalIndex);
                break;
            case 6: {
                const activeTasks = filteredTasks.filter(t => !t.completed);
                if (state.v6Mode === 'reverse') {
                    sortedAndProcessedTasks = activeTasks.sort((a, b) => b.originalIndex - a.originalIndex);
                } else { // forward mode
                    sortedAndProcessedTasks = activeTasks.sort((a, b) => a.originalIndex - b.originalIndex);
                }
                break;
            }
            case 8: {
                const todayStr = getDateString(new Date());
                sortedAndProcessedTasks = filteredTasks
                    .filter(t => t.pageDate && t.pageDate >= todayStr && !t.completed)
                    .sort((a, b) => {
                        if (a.pageDate! < b.pageDate!) return -1;
                        if (a.pageDate! > b.pageDate!) return 1;
                        return a.originalIndex - b.originalIndex;
                    });
                break;
            }
            case 7: {
                let v7tasks: Task[];
                if (v7ActiveList === 'main') {
                    v7tasks = filteredTasks.filter(t => t.v7list === 'main' && !t.completed);
                } else if (v7ActiveList === 'recurring') {
                    v7tasks = filteredTasks.filter(t => t.v7list === 'recurring' && !t.completed);
                } else { // unfinished
                    v7tasks = filteredTasks.filter(t => t.v7list === 'unfinished' && !t.completed);
                }
                sortedAndProcessedTasks = v7tasks.sort((a, b) => a.originalIndex - b.originalIndex);
                break;
            }
            default:
                 sortedAndProcessedTasks = filteredTasks.filter(t => !t.completed);
        }
        
        return sortedAndProcessedTasks;
    }, [
        state.tasks, state.currentParentTask, currentTab, state.activeTagFilter, state.searchQuery,
        state.contexts, state.activeContextIds, state.excludedContextIds, state.contextLogic, state.isFilteringByNoNextAction,
        taskSystemVersion, state.v3ActiveTaskIds, state.v6Mode, v7ActiveList
    ]);

    // Step 2: Memoize the pagination logic separately.
    // This runs only when the master list from Step 1 or the currentPage changes.
    const { tasksToRender, pageCount } = useMemo(() => {
        if (state.currentParentTask) {
            return { tasksToRender: allSortedTasks, pageCount: 1 };
        }

        let pCount = 1;
        let paginatedTasks: (Task | Subtask)[] = allSortedTasks;

        const tasksPerPage = taskSystemVersion === 4 ? V4_TASKS_PER_PAGE : TASKS_PER_PAGE;
        const shouldPaginate = [1, 2, 4].includes(taskSystemVersion) || (taskSystemVersion === 6 && state.v6Mode === 'forward');
        
        if (shouldPaginate) {
            pCount = Math.ceil(allSortedTasks.length / tasksPerPage) || 1;
            paginatedTasks = allSortedTasks.slice(
                (state.currentPage - 1) * tasksPerPage,
                state.currentPage * tasksPerPage
            );
        } else {
            pCount = 1;
        }
        
        return { tasksToRender: paginatedTasks, pageCount: pCount };
    }, [allSortedTasks, state.currentPage, state.currentParentTask, taskSystemVersion, state.v6Mode]);

    useEffect(() => {
        if (state.activeTaskId) {
            const element = document.querySelector(`[data-task-id="${state.activeTaskId}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [state.activeTaskId]);
    
    // Auto-scroll for V5 and V6
    const { completedTaskCount } = derivedState;
    const taskCount = state.tasks.length;
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        if (taskSystemVersion === 5) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (taskSystemVersion === 6 && state.v6Mode === 'reverse') {
            mainContent.scrollTo({ top: mainContent.scrollHeight, behavior: 'smooth' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completedTaskCount, taskCount, taskSystemVersion, state.v6Mode]);

    // Keyboard navigation and hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTextInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) && target.id !== 'quick-add-input';
            const isEditing = target.isContentEditable;
    
            const tasksForNav = tasksToRender as (Task | Subtask)[];
    
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (isTextInput) return;
                e.preventDefault();

                if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
                    (document.activeElement as HTMLElement).blur();
                }
                
                if (tasksForNav.length === 0) return;
    
                const visibleTaskIds = tasksForNav.map(t => t.id);
                const currentIndex = state.activeTaskId ? visibleTaskIds.indexOf(state.activeTaskId) : -1;
                let nextIndex;

                if (taskSystemVersion === 6 && state.v6Mode === 'reverse') {
                    if (e.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : Math.max(currentIndex - 1, 0);
                    else nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, visibleTaskIds.length - 1);
                } else {
                    if (e.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, visibleTaskIds.length - 1);
                    else nextIndex = currentIndex < 0 ? 0 : Math.max(currentIndex - 1, 0);
                }
                
                const nextId = visibleTaskIds[nextIndex];
                if (nextId) handlers.setActiveTaskId(nextId);
                return;
            }
    
            const activeItem = state.activeTaskId ? state.tasks.find(t => t.id === state.activeTaskId) : null;
    
            if (e.altKey && activeItem) {
                e.preventDefault();
                const isSubtask = !('parentId' in activeItem);
                const taskId = activeItem.id;
                switch (e.code) {
                    case 'KeyV': handlers.handleToggleComplete(taskId, isSubtask); break;
                    case 'KeyX': handlers.handleDeleteTask(taskId, isSubtask); break;
                    case 'KeyC': if (!isSubtask) handlers.handleUndoTask(taskId); break;
                    case 'KeyS': if (!isSubtask) handlers.handleStarTask(taskId); break;
                    case 'KeyR': if (!isSubtask) handlers.handleRepeatTask(taskId); break;
                }
                return;
            }
    
            if (isTextInput) return;
    
            if (e.key === 'Enter') {
                if (activeItem && 'subtasks' in activeItem && activeItem.subtasks.length > 0 && !isEditing) {
                    e.preventDefault();
                    handlers.setCurrentParentTask(activeItem as Task);
                }
            } else if (e.key === 'Backspace' && state.currentParentTask && !isEditing) {
                e.preventDefault();
                const parentIndex = derivedState.breadcrumbs.findIndex(b => b.id === state.currentParentTask!.id);
                handlers.setCurrentParentTask(parentIndex > 0 ? derivedState.breadcrumbs[parentIndex - 1] : null);
            }
        };
    
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        tasksToRender, state.activeTaskId, state.currentParentTask, state.tasks,
        derivedState.breadcrumbs, handlers, taskSystemVersion, state.v6Mode,
    ]);
    
    const handleDrop = (e: React.DragEvent) => {
        if (!draggedItem || !dragOverItem) return;
        handlers.handleDrop(draggedItem, dragOverItem);
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const renderPaginationControls = () => {
        if (pageCount <= 1 || state.currentParentTask) return null;
        
        const shouldShow = [1, 2, 4].includes(taskSystemVersion) || (taskSystemVersion === 6 && state.v6Mode === 'forward');
        if (!shouldShow) return null;

        return (
            <div className="flex justify-center flex-wrap gap-2 mt-4">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => handlers.setCurrentPage(page)}
                        className={`px-3 py-1 text-xs rounded-md ${state.currentPage === page ? 'bg-[var(--accent-neon)] text-white' : 'bg-[var(--glass-bg)]'}`}
                    >{page}</button>
                ))}
            </div>
        );
    };
    
    const isInputVisible = !isFocusMode && !state.currentParentTask;

    const renderTaskItem = (task: Task | Subtask, index: number) => (
         <TaskItem key={task.id} item={task} index={index} tasks={state.tasks}
                allTags={derivedState.allTags}
                currentTab={currentTab}
                taskSystemVersion={taskSystemVersion}
                activeTaskId={state.activeTaskId} setActiveTaskId={handlers.setActiveTaskId}
                activeTagFilter={state.activeTagFilter} onTagClick={handleTagClick}
                v3ActiveTaskIds={state.v3ActiveTaskIds}
                v5ScanIndex={state.v5ScanIndex}
                handleToggleComplete={handlers.handleToggleComplete}
                handleDeleteTask={handlers.handleDeleteTask} handleUndoTask={handlers.handleUndoTask}
                handleStarTask={handlers.handleStarTask} handleRepeatTask={handlers.handleRepeatTask}
                handleUpdateTaskText={handlers.handleUpdateTaskText} 
                handleUpdateTaskNote={handlers.handleUpdateTaskNote}
                handleAddSubtask={handlers.handleAddSubtask}
                handleAddTag={handlers.handleAddTag}
                handleRemoveTag={handlers.handleRemoveTag}
                handleEnterTask={handlers.setCurrentParentTask} handleToggleCollapse={handlers.handleToggleCollapse}
                handleTogglePriorityDetails={handlers.handleTogglePriorityDetails}
                handleUpdatePriorityDetail={handlers.handleUpdatePriorityDetail}
                handleBrainstormTimerToggle={handlers.handleBrainstormTimerToggle}
                onV3SelectTask={handlers.handleV3SelectTask}
                handleV7MarkUnfinished={handlers.handleV7MarkUnfinished}
                handleV7MarkRecurring={handlers.handleV7MarkRecurring}
                onFocusTask={onFocusTask}
                onStartDistillation={onProbeTask}
                onDragStart={(e, item) => setDraggedItem(item)}
                onDragOver={(e, item) => { e.preventDefault(); setDragOverItem(item); }}
                onDrop={handleDrop}
                isDraggable={!state.currentParentTask && taskSystemVersion === 1}
            />
    );
    
    let taskElements: (React.ReactElement | null)[] = [];

    if (taskSystemVersion === 8) {
        let lastDate: string | null = null;
        (tasksToRender as Task[]).forEach((task, index) => {
            if (task.pageDate && task.pageDate !== lastDate) {
                lastDate = task.pageDate;
                const date = new Date(task.pageDate + 'T12:00:00Z'); // Use UTC noon to avoid timezone date shifts
                taskElements.push(
                    <div key={`header-${task.pageDate}`} className="sticky top-0 bg-[var(--bg-container)]/80 backdrop-blur-sm py-2 -mx-6 px-6 z-10 mt-4 mb-2 border-y border-[var(--glass-border)]">
                        <h3 className="font-bold text-[var(--text-color)] text-base">
                            {date.toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                    </div>
                );
            }
            taskElements.push(renderTaskItem(task, index));
        });
    } else {
        taskElements = (tasksToRender as (Task | Subtask)[]).map((task, index) => {
            const isTask = 'originalIndex' in task;
            const taskItem = renderTaskItem(task, index);

            if (isTask && !state.currentParentTask && (
                (taskSystemVersion === 2 && task.id === state.v2LineTaskId) ||
                (taskSystemVersion === 6 && task.id === state.v6LineTaskId) ||
                (taskSystemVersion === 7 && task.id === state.v7LineTaskId && v7ActiveList === 'main')
            )) {
                let lineText = '';
                let onReset = () => {};
                if (taskSystemVersion === 2) {
                    lineText = 'Достигнута черта, начать новый цикл';
                    onReset = handlers.handleV2ResetScan;
                } else if (taskSystemVersion === 6) {
                    lineText = 'Задачи выше на уведомлении для обзора';
                } else if (taskSystemVersion === 7) {
                    lineText = 'Ниже новые задачи';
                }

                return (
                    <React.Fragment key={`${task.id}-fragment`}>
                        {taskItem}
                        <div key="separator-line" className="my-4 flex items-center gap-4 text-[var(--text-secondary)]">
                            <hr className="flex-grow border-t-2 border-dashed border-[var(--glass-border)]" />
                            <button 
                                onClick={() => {
                                    onReset();
                                    const mainContent = document.querySelector('.main-content');
                                    if (mainContent) mainContent.scrollTop = 0;
                                }}
                                className="px-4 py-2 text-xs font-semibold bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full hover:border-[var(--accent-soft)] hover:text-[var(--accent-soft)] transition-colors disabled:cursor-default disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--glass-border)]"
                                disabled={taskSystemVersion === 6 || taskSystemVersion === 7}
                            >
                                {lineText}
                            </button>
                            <hr className="flex-grow border-t-2 border-dashed border-[var(--glass-border)]" />
                        </div>
                    </React.Fragment>
                );
            }
            return taskItem;
        });
    }

    const renderVersionControls = () => {
        if (isFocusMode || currentTab !== 'tasks' || state.currentParentTask) return null;
        switch(taskSystemVersion) {
            case 3:
                const needed = 3 - state.v3ActiveTaskIds.length;
                const getV3Prompt = () => {
                    if (state.v3ActiveTaskIds.length === 3) {
                        return 'Сфокусируйтесь на этих 3 задачах. Выполните 2, чтобы завершить цикл.';
                    }
                    if (state.v3ActiveTaskIds.length === 1) {
                         const remainingTask = state.tasks.find(t => t.id === state.v3ActiveTaskIds[0]);
                         if (remainingTask) {
                             return <>Цикл завершен! <strong>"{remainingTask.text}"</strong> осталась. Выберите еще 2 задачи.</>
                         }
                    }
                    return `Выберите еще ${needed} ${needed === 1 ? 'задачу' : (needed === 2 ? 'задачи' : 'задач')}.`;
                };
                return (
                    <div className="text-center p-3 rounded-lg bg-[var(--glass-bg)]/80 my-2 border border-[var(--glass-border)] text-sm">
                        <h4 className="font-semibold text-base mb-1">Режим 3-T</h4>
                        <p className="text-[var(--text-secondary)]">{getV3Prompt()}</p>
                        {state.v3ActiveTaskIds.length > 0 && (
                            <button onClick={handlers.handleV3ClearSelection} className="text-xs text-[var(--undone)] hover:underline mt-2">
                                Сбросить выбор
                            </button>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="text-center p-3 rounded-lg bg-[var(--glass-bg)]/80 my-2 border border-[var(--glass-border)] text-sm">
                        <h4 className="font-semibold text-base mb-1">Режим AF2</h4>
                        <p className="text-[var(--text-secondary)] mb-2">Начинайте сканирование сверху (с новых задач). После каждого действия возвращайтесь к началу.</p>
                        <button 
                            onClick={handlers.handleV5StartNewDay} 
                            className="px-3 py-1.5 text-xs bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] rounded hover:bg-[var(--accent-soft)]/40"
                        >
                            Начать день / Отметить старые задачи
                        </button>
                    </div>
                );
            case 6:
                return (
                    <div className="flex justify-center items-center gap-4 my-2 p-2 bg-[var(--glass-bg)]/80 rounded-lg border border-[var(--glass-border)]">
                        <button onClick={handlers.handleV6StartNewDay} className="px-3 py-1.5 text-xs bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] rounded hover:bg-[var(--accent-soft)]/40">
                            Начать новый день / Обзор
                        </button>
                        <button 
                            onClick={() => {
                                const newMode = state.v6Mode === 'reverse' ? 'forward' : 'reverse';
                                handlers.setV6Mode(newMode);
                                handlers.setCurrentPage(1); // Reset page on mode switch
                            }} 
                            className="px-3 py-1.5 text-xs bg-sky-500/20 text-sky-400 rounded hover:bg-sky-500/40"
                        >
                            {state.v6Mode === 'reverse' ? 'Перейти в прямой режим ▶' : '◀ Перейти в обратный режим'}
                        </button>
                    </div>
                );
            case 7: {
                 const lineTask = state.tasks.find(l => l.id === state.v7LineTaskId);
                 const oldTasks = state.tasks.filter(t => {
                    if (!lineTask || t.completed || t.v7list !== 'main') return false;
                    return t.originalIndex <= lineTask.originalIndex;
                });

                return (
                    <div className="flex justify-center items-center gap-4 my-2 p-2 bg-[var(--glass-bg)]/80 rounded-lg border border-[var(--glass-border)] flex-wrap">
                        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-md">
                            <button onClick={() => setV7ActiveList('main')} className={`px-2 py-0.5 text-xs rounded ${v7ActiveList === 'main' ? 'bg-[var(--accent-soft)] text-black' : 'text-[var(--text-secondary)]'}`}>Главный</button>
                            <button onClick={() => setV7ActiveList('recurring')} className={`px-2 py-0.5 text-xs rounded ${v7ActiveList === 'recurring' ? 'bg-[var(--accent-soft)] text-black' : 'text-[var(--text-secondary)]'}`}>Повторяющиеся</button>
                            <button onClick={() => setV7ActiveList('unfinished')} className={`px-2 py-0.5 text-xs rounded ${v7ActiveList === 'unfinished' ? 'bg-[var(--accent-soft)] text-black' : 'text-[var(--text-secondary)]'}`}>Незавершенные</button>
                        </div>
                        {v7ActiveList === 'main' && (
                            <>
                                <button 
                                    onClick={handlers.handleV7NewCycle} 
                                    disabled={oldTasks.length > 0} 
                                    title={oldTasks.length > 0 ? "Сначала завершите все старые задачи" : "Сделать новые задачи старыми"}
                                    className="px-3 py-1.5 text-xs bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] rounded hover:bg-[var(--accent-soft)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Начать новый цикл
                                </button>
                                <button 
                                    onClick={handlers.handleV7DismissOldTasks}
                                    className="px-3 py-1.5 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/40"
                                >
                                    Отклонить старые задачи
                                </button>
                            </>
                        )}
                    </div>
                );
            }
            case 8: {
                 return null;
            }
            default: return null;
        }
    }
    
    const activeView = state.activeViewId ? state.savedViews.find(v => v.id === state.activeViewId) : null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                {state.currentParentTask && (
                    <div className="mb-2 text-sm text-[var(--text-secondary)]">
                        <button onClick={() => handlers.setCurrentParentTask(null)} className="hover:text-[var(--accent-neon)] mr-2">⬅</button>
                        {derivedState.breadcrumbs.map((crumb, index) => (
                            <span key={crumb.id}>
                                <button onClick={() => handlers.setCurrentParentTask(crumb)} className="hover:text-[var(--accent-neon)]">{crumb.text}</button>
                                {index < derivedState.breadcrumbs.length - 1 && ' / '}
                            </span>
                        ))}
                    </div>
                )}
                {state.activeTagFilter && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span>Фильтр по тегу:</span>
                        <span className="px-2 py-1 rounded-md bg-[var(--accent-neon)] text-black font-semibold">
                            {state.activeTagFilter}
                        </span>
                        <button onClick={() => handlers.setActiveTagFilter(null)} className="text-[var(--undone)] hover:text-red-400 font-bold text-lg leading-none">
                            &times;
                        </button>
                    </div>
                )}
                {state.isFilteringByNoNextAction && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span>Фильтр: Проекты без след. действия</span>
                        <button onClick={handlers.handleToggleNoNextActionFilter} className="text-[var(--undone)] hover:text-red-400 font-bold text-lg leading-none">
                            &times;
                        </button>
                    </div>
                )}
                
                {taskSystemVersion === 1 && !state.currentParentTask && !isFocusMode && (
                    <p className="text-center my-4 text-lg font-semibold text-[var(--accent-soft)] italic">
                        Что я хочу сделать, прежде чем сделаю X?
                    </p>
                )}

                {!isFocusMode && currentTab === 'tasks' && <ContextFilter appData={appData} onViewSaved={onViewSaved} />}

                {activeView && (
                    <div className="text-center p-2 rounded-lg bg-[var(--glass-bg)]/50 my-2 text-sm text-[var(--text-secondary)]">
                        Просмотр: <span className="font-semibold text-[var(--text-color)]">{activeView.icon} {activeView.name}</span>
                    </div>
                )}


                {isInputVisible && (
                    <QuickAddTask
                        onAddTask={handlers.handleAddTask}
                        currentTab={currentTab}
                    />
                )}
                
                {renderVersionControls()}
            </div>
            
            <div className="flex-grow pr-2 min-h-0">
                {taskElements.length > 0 ? taskElements : <EmptyState />}
                {taskSystemVersion === 4 && tasksToRender.length > 0 && (
                    <div className="text-center mt-4 flex justify-center gap-4">
                        <button
                            onClick={handlers.handleV4DismissPage}
                            disabled={state.currentPage === pageCount}
                            className="px-4 py-2 text-sm bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500/30"
                            title={state.currentPage === pageCount ? "Нельзя отклонить последнюю страницу" : "Скрыть все задачи на этой странице"}
                        >
                            Ничего не выделяется, отклонить страницу
                        </button>
                        <button
                            onClick={handlers.handleV4RestoreDismissed}
                            className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30 hover:bg-blue-500/30"
                        >
                            Восстановить отложенные
                        </button>
                    </div>
                )}
                {renderPaginationControls()}
            </div>
        </div>
    );
};

export default TaskView;