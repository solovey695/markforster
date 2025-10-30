import { useState, useMemo } from 'react';
import { useAppData } from './useAppData';
import { Tab } from '../types';

type AppData = ReturnType<typeof useAppData>;

export interface CommandAction {
    id: string;
    type: 'navigation' | 'task' | 'action';
    title: string;
    category: string;
    icon: string;
    tab?: Tab;
    perform?: () => void;
}

export const useCommandPalette = (appData: AppData) => {
    const { state, handlers } = appData;
    const [query, setQuery] = useState('');

    const allActions: CommandAction[] = useMemo(() => {
        const actions: CommandAction[] = [];

        // Navigation
        actions.push(
            { id: 'nav-tasks', type: 'navigation', title: 'Перейти к Задачам', category: 'Навигация', icon: '📝', tab: 'tasks' },
            { id: 'nav-projects', type: 'navigation', title: 'Перейти к Проектам', category: 'Навигация', icon: '📁', tab: 'projects' },
            { id: 'nav-kanban', type: 'navigation', title: 'Перейти к Канбан', category: 'Навигация', icon: '📋', tab: 'kanban' },
            { id: 'nav-habits', type: 'navigation', title: 'Перейти к Привычкам', category: 'Навигация', icon: '🔄', tab: 'habits' },
            { id: 'nav-archive', type: 'navigation', title: 'Перейти к Архиву', category: 'Навигация', icon: '🗄️', tab: 'archive' },
        );
        
        // Tasks
        state.tasks
            .filter(t => !t.hidden && !t.completed)
            .forEach(task => {
                actions.push({
                    id: task.id,
                    type: 'task',
                    title: task.text,
                    category: 'Задачи',
                    icon: '🎯'
                });
            });

        // Actions
        actions.push({
            id: 'action-archive',
            type: 'action',
            title: 'Архивировать выполненные задачи',
            category: 'Действия',
            icon: '🗄️',
            perform: handlers.handleArchiveCompletedTasks
        });

        return actions;
    }, [state.tasks, handlers.handleArchiveCompletedTasks]);

    const filteredActions = useMemo(() => {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (!lowerCaseQuery) {
            // Group actions by category for the initial view
            const grouped = allActions.reduce((acc, action) => {
                if (action.type !== 'task') { // Exclude tasks from initial view
                    (acc[action.category] = acc[action.category] || []).push(action);
                }
                return acc;
            }, {} as Record<string, CommandAction[]>);
            return Object.values(grouped).flat();
        }

        return allActions.filter(action => 
            action.title.toLowerCase().includes(lowerCaseQuery) ||
            action.category.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query, allActions]);

    return { query, setQuery, filteredActions };
};
