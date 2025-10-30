import React, { useState } from 'react';
import { Task } from '../types';
import { useAppData } from '../hooks/useAppData';
import { highlightVerbs } from '../utils/highlightVerbs';
import ChessClock from './ChessClock';
import AnimatedCheckbox from './AnimatedCheckbox';

type AppData = ReturnType<typeof useAppData>;

interface TaskFocusViewProps {
    task: Task;
    onExit: () => void;
    appData: AppData;
}

const TaskFocusView: React.FC<TaskFocusViewProps> = ({ task, onExit, appData }) => {
    const { handlers } = appData;

    const [note, setNote] = useState(task.note);
    const [subtaskInput, setSubtaskInput] = useState('');
    const [priorityDetails, setPriorityDetails] = useState(task.priorityDetails);

    const handleAddSubtask = () => {
        if (subtaskInput.trim()) {
            handlers.handleAddSubtask(task.id, subtaskInput.trim());
            setSubtaskInput('');
        }
    };
    
    const handleUpdatePriority = (field: keyof Task['priorityDetails'], value: string) => {
        const newDetails = { ...priorityDetails, [field]: value };
        setPriorityDetails(newDetails);
        handlers.handleUpdatePriorityDetail(task.id, field, value);
    };

    return (
        <div className="task-focus-view">
            <button
                onClick={onExit}
                className="absolute top-4 right-4 text-2xl p-2 text-[var(--text-secondary)] hover:text-[var(--text-color)] z-10"
                title="Выйти из режима фокуса (Esc)"
            >
                &times;
            </button>

            <div className="task-focus-grid">
                {/* Main Content */}
                <div className="task-focus-main">
                    {/* Header */}
                    <header>
                        <h1
                            className="text-4xl font-bold text-[var(--text-color)] mb-2"
                            dangerouslySetInnerHTML={{ __html: highlightVerbs(task.text) }}
                        />
                        <div className="flex flex-wrap gap-2">
                            {task.tags.split(' ').filter(Boolean).map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md text-xs bg-[var(--accent-soft)]/20 text-[var(--accent-soft)]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </header>

                    {/* Priority Details */}
                    {Object.values(task.priorityDetails).some(val => val) && (
                         <div>
                            <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Приоритет</h2>
                            <div className="p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)] grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(['why', 'vision', 'brainstorm', 'organization'] as const).map(field => (
                                    <div key={field}>
                                        <h4 className="font-semibold text-xs capitalize text-[var(--text-secondary)]">{field}</h4>
                                        <textarea
                                            value={priorityDetails[field]}
                                            onChange={(e) => handleUpdatePriority(field, e.target.value)}
                                            className="w-full bg-black/20 p-1.5 rounded text-xs mt-1 h-24 resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Notes */}
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Заметки</h2>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onBlur={() => handlers.handleUpdateTaskNote(task.id, note)}
                            placeholder="Здесь можно писать заметки..."
                            className="w-full p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)] min-h-[120px] resize-y"
                        />
                    </div>

                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                        <div>
                             <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Подзадачи</h2>
                             <div className="space-y-2">
                                {task.subtasks.map(subtask => (
                                    <div key={subtask.id} className={`flex items-center gap-3 p-3 rounded-lg ${subtask.completed ? 'bg-green-500/10 opacity-60' : 'bg-[var(--glass-bg)]'}`}>
                                        <AnimatedCheckbox
                                            completed={subtask.completed}
                                            onClick={() => handlers.handleToggleComplete(subtask.id, true)}
                                        />
                                        <span className={`flex-grow ${subtask.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-color)]'}`}>
                                            {subtask.text}
                                        </span>
                                        <button onClick={() => handlers.handleDeleteTask(subtask.id, true)} className="text-[var(--text-secondary)] hover:text-[var(--undone)] text-lg">&times;</button>
                                    </div>
                                ))}
                                 <div className="flex items-center gap-3 p-2">
                                    <span className="text-2xl text-[var(--text-secondary)]">+</span>
                                    <input
                                        type="text"
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSubtask();
                                            }
                                        }}
                                        placeholder="Добавить подзадачу..."
                                        className="w-full bg-transparent text-sm py-1 outline-none border-b border-transparent focus:border-[var(--glass-border)] transition-colors"
                                    />
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="task-focus-sidebar">
                    <div className="p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)]">
                        <ChessClock appData={appData} />
                    </div>
                     <div className="p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] space-y-1">
                         <p>Создано: {new Date(task.createdAt).toLocaleString()}</p>
                         <p>Обновлено: {new Date(task.updatedAt).toLocaleString()}</p>
                     </div>
                </aside>
            </div>
        </div>
    );
};

export default TaskFocusView;