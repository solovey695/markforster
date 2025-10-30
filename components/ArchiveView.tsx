import React from 'react';
import { Task } from '../types';

interface ArchiveViewProps {
    archivedTasksToDisplay: Task[];
    onRestoreTask: (taskId: string) => void;
}

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-[var(--accent-soft)]/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <h3 className="text-lg font-semibold text-[var(--text-color)]">Архив пуст</h3>
        <p>Выполненные задачи появятся здесь после архивации.</p>
    </div>
);


const ArchiveView: React.FC<ArchiveViewProps> = ({ archivedTasksToDisplay, onRestoreTask }) => {
    if (archivedTasksToDisplay.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="h-full pr-2">
            {archivedTasksToDisplay.map(task => (
                <div key={task.id} className="p-3 rounded-lg mb-2 bg-gray-500/20 opacity-50 flex justify-between items-center">
                    <p className="line-through">{task.text}</p>
                    <button onClick={() => onRestoreTask(task.id)} className="p-2 text-lg hover:bg-white/10 rounded-full" title="Восстановить задачу">↩️</button>
                </div>
            ))}
        </div>
    );
};

export default ArchiveView;