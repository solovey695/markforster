import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { Tab } from '../types';

type AppData = ReturnType<typeof useAppData>;

const MetricsPanel: React.FC<{ appData: AppData; onTabChange: (tab: Tab) => void; }> = ({ appData, onTabChange }) => {
    const { projectMetrics, taskMetrics, weeklyCompletedProjects, totalActiveProjectsThisWeek } = appData.derivedState;
    const { handlers, state } = appData;
    
    const handleNoNextActionClick = () => {
        handlers.handleToggleNoNextActionFilter();
        onTabChange('projects');
    }

    const renderCircle = (percentage: number) => (
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700/50 mt-1" style={{ background: `conic-gradient(var(--accent-neon) ${percentage * 360}deg, var(--border-color) 0deg)` }}>
            <span className="text-xs">{Math.round(percentage * 100)}%</span>
        </div>
    );
    
    const weeklyProgressPercentage = totalActiveProjectsThisWeek > 0 
        ? Math.round((weeklyCompletedProjects / totalActiveProjectsThisWeek) * 100)
        : 0;

    return (
        <div className="mt-4 p-4 bg-[var(--glass-bg)] rounded-lg text-sm space-y-4">
            <div>
                <h3 className="font-bold">Метрики Проектов</h3>
                <div className="grid grid-cols-2 gap-2 items-start mt-2">
                    <div className="p-2 rounded-lg flex flex-col items-center text-center">
                        <p>Незавершено: {projectMetrics.incomplete} / {projectMetrics.total}</p>
                        {renderCircle(projectMetrics.total > 0 ? projectMetrics.incomplete / projectMetrics.total : 0)}
                    </div>
                    <button 
                        onClick={handleNoNextActionClick}
                        className={`p-2 rounded-lg transition-colors flex flex-col items-center text-center w-full ${state.isFilteringByNoNextAction ? 'bg-[var(--accent-soft)]/20' : 'hover:bg-white/5'}`}
                    >
                        <p>Без след. действия: {projectMetrics.withoutNextAction}</p>
                        {renderCircle(projectMetrics.total > 0 ? projectMetrics.withoutNextAction / projectMetrics.total : 0)}
                    </button>
                </div>
            </div>
            <div>
                <h3 className="font-bold">Метрики Задач</h3>
                <div className="flex justify-around items-start mt-2">
                    <div className="flex flex-col items-center">
                        <p>Незавершено: {taskMetrics.incomplete} / {taskMetrics.total}</p>
                        {renderCircle(taskMetrics.total > 0 ? taskMetrics.incomplete / taskMetrics.total : 0)}
                    </div>
                    <div className="flex flex-col items-center justify-center text-center flex-grow h-full pt-2">
                        <p>Старые/Новые: {taskMetrics.oldTasks} / {taskMetrics.newTasks}</p>
                    </div>
                </div>
            </div>
            <p className="text-center">Прогресс за неделю: Завершено {weeklyCompletedProjects} из {totalActiveProjectsThisWeek} акт. проектов ({weeklyProgressPercentage}%)</p>
        </div>
    );
};

export default MetricsPanel;