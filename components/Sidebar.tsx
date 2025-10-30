import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';
import MementoMori from './MementoMori';
import { useAppData } from '../hooks/useAppData';
import MetricsPanel from './MetricsPanel';
import CircleTracker from './CircleTracker';
import ChessClock from './ChessClock';
import PlayerStatus from './PlayerStatus';
import { THEMES } from '../constants';
import { useMediaQuery } from '../hooks/useMediaQuery';
// FIX: Corrected import path for AlchemyStatus component.
import AlchemyStatus from './NeuralStatus';


type AppData = ReturnType<typeof useAppData>;

interface SidebarProps {
    appData: AppData;
    currentTab: Tab;
    onTabChange: (tab: Tab) => void;
    birthDate: string | null;
    onBirthDateChange: (date: string) => void;
    theme: string;
    onThemeChange: (theme: string) => void;
    onVersionModalOpen: () => void;
    onStartReview: () => void;
    onClose: () => void;
    isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    appData, currentTab, onTabChange, birthDate, onBirthDateChange,
    theme, onThemeChange, onVersionModalOpen, onStartReview, onClose, isCollapsed = false
}) => {
    
    const navItems: { id: Tab, name: string, icon: string }[] = [
        { id: 'tasks', name: 'Задачи', icon: '📝' },
        { id: 'projects', name: 'Проекты', icon: '📁' },
        { id: 'kanban', name: 'Канбан', icon: '📋' },
        { id: 'system', name: 'Система', icon: '📊' },
        { id: 'laboratory', name: 'Лаборатория', icon: '⚗️' },
        { id: 'habits', name: 'Привычки', icon: '🔄' },
        { id: 'archive', name: 'Архив', icon: '🗄️' },
    ];

    const { state, handlers, derivedState } = appData;
    const isMobile = useMediaQuery('(max-width: 1024px)');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [statsOpen, setStatsOpen] = useState(true);
    const [toolsOpen, setToolsOpen] = useState(true);

    useEffect(() => {
        setStatsOpen(localStorage.getItem('sidebar-stats-open') !== 'false');
        setToolsOpen(localStorage.getItem('sidebar-tools-open') !== 'false');
    }, []);

    const handleToggleDetails = (section: 'stats' | 'tools', event: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
        const isOpen = (event.target as HTMLDetailsElement).open;
        if (section === 'stats') {
            setStatsOpen(isOpen);
            localStorage.setItem('sidebar-stats-open', String(isOpen));
        } else {
            setToolsOpen(isOpen);
            localStorage.setItem('sidebar-tools-open', String(isOpen));
        }
    };
    
    const handleViewClick = (viewId: string) => {
        handlers.handleApplyView(viewId);
        onTabChange('tasks');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const importedCount = await handlers.handleImportMloTasks(file);
                if (importedCount > 0) {
                    alert(`Импорт завершен! Добавлено ${importedCount} задач.`);
                } else {
                    alert('В файле не найдено задач для импорта.');
                }
            } catch (error: any) {
                alert(`Ошибка импорта: ${error.message}`);
            }
        }
        // Reset file input to allow importing the same file again
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="sidebar">
            <div className="bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-4 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)]">
                {!isCollapsed && <PlayerStatus appData={appData} />}
                {!isCollapsed && <div className="my-2 border-t border-[var(--glass-border)] -mx-4" />}
                {!isCollapsed && <AlchemyStatus appData={appData} />}
                <div className={`flex justify-between items-center mb-3 px-2 pt-2 ${isCollapsed ? 'hidden' : ''}`}>
                    <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider">Навигация</h2>
                    {isMobile && <button onClick={onClose} className="text-2xl text-[var(--text-secondary)]">&times;</button>}
                </div>
                 {isMobile && !isCollapsed && (
                    <div className="mb-4 px-2 space-y-2">
                        <select value={theme} onChange={(e) => onThemeChange(e.target.value)} className="w-full bg-[var(--glass-bg)] text-[var(--text-color)] border border-[var(--glass-border)] rounded-md p-2 text-sm">
                            {Object.keys(THEMES).map(themeName => (
                                <option key={themeName} value={themeName}>
                                    {themeName.charAt(0).toUpperCase() + themeName.slice(1).replace(/-/g, ' ')}
                                </option>
                            ))}
                        </select>
                        {currentTab === 'tasks' &&
                            <button 
                                onClick={onVersionModalOpen} 
                                className="w-full bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] rounded-md p-2 text-sm font-semibold text-left"
                            >
                                Система: v{state.taskSystemVersion}
                            </button>
                        }
                    </div>
                 )}
                <nav className="flex flex-col gap-1">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => onTabChange(item.id)}
                            title={isCollapsed ? item.name : undefined}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-container)] focus:ring-[var(--accent-neon)] ${
                                currentTab === item.id && !state.activeViewId
                                ? 'bg-[var(--accent-soft)]/20 text-[var(--accent-neon)]' 
                                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-color)]'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {!isCollapsed && <span>{item.name}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            <div className={`bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-4 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)]`}>
                <div className={`flex justify-between items-center mb-1 px-2 ${isCollapsed ? 'hidden' : ''}`}>
                     <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider">Виды</h2>
                </div>
                <nav className="flex flex-col gap-1">
                     {state.savedViews.map(view => (
                        <button 
                            key={view.id}
                            onClick={() => handleViewClick(view.id)}
                            title={isCollapsed ? view.name : undefined}
                            className={`group relative flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-container)] focus:ring-[var(--accent-neon)] ${
                                state.activeViewId === view.id
                                ? 'bg-[var(--accent-soft)]/20 text-[var(--accent-neon)]' 
                                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-color)]'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <span className="text-lg">{view.icon}</span>
                            {!isCollapsed && <span className="flex-grow text-left truncate">{view.name}</span>}
                             {!isCollapsed && <button
                                onClick={(e) => { e.stopPropagation(); handlers.handleDeleteView(view.id); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/70 hover:text-[var(--undone)] font-bold text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-container)] rounded-full w-5 h-5 flex items-center justify-center"
                                aria-label={`Delete view ${view.name}`}
                            >
                                &times;
                            </button>}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className={`bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-4 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)] ${isCollapsed ? 'hidden' : ''}`}>
                 <details className="group" open={statsOpen} onToggle={(e) => handleToggleDetails('stats', e)}>
                    <summary className="list-none cursor-pointer group-hover:text-[var(--text-color)]">
                        <div className="flex justify-between items-center py-2 text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider">
                            <span>Статистика</span>
                            <span className="transition-transform duration-200 group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                     <div className="pt-2">
                        {currentTab !== 'habits' && currentTab !== 'archive' && (
                            <>
                                <MetricsPanel appData={appData} onTabChange={onTabChange} />
                                <CircleTracker completedCount={derivedState.completedTaskCount} />
                            </>
                        )}
                     </div>
                 </details>
            </div>
            
             <details className={`bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-4 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)] group ${isCollapsed ? 'hidden' : ''}`} open={toolsOpen} onToggle={(e) => handleToggleDetails('tools', e)}>
                <summary className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider cursor-pointer group-hover:text-[var(--text-color)]">Инструменты</summary>
                <div className="mt-4 space-y-4">
                    <button 
                        onClick={onStartReview}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--glass-bg)] text-[var(--text-color)] font-semibold rounded-lg hover:bg-white/10 transition-colors border border-[var(--glass-border)]"
                    >
                        <span>⚡️</span>
                        <span>Быстрый Обзор</span>
                    </button>
                    <button 
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--glass-bg)] text-[var(--text-color)] font-semibold rounded-lg hover:bg-white/10 transition-colors border border-[var(--glass-border)]"
                    >
                        <span>📥</span>
                        <span>Импорт из MLO</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xml"
                        className="hidden"
                    />
                    <ChessClock appData={appData} />
                    <MementoMori 
                        birthDate={birthDate}
                        onBirthDateChange={onBirthDateChange}
                    />
                </div>
            </details>
            
            {!isCollapsed && !isMobile && (
                 <details className={`bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-4 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)] group`} open>
                    <summary className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider cursor-pointer group-hover:text-[var(--text-color)]">Настройки</summary>
                    <div className="mt-4 space-y-2">
                         <div>
                            <label htmlFor="theme-switcher-desktop" className="block text-sm text-[var(--text-secondary)] mb-1">Тема</label>
                            <select id="theme-switcher-desktop" value={theme} onChange={(e) => onThemeChange(e.target.value)} className="w-full bg-[var(--glass-bg)] text-[var(--text-color)] border border-[var(--glass-border)] rounded-md p-2 text-sm">
                                {Object.keys(THEMES).map(themeName => (
                                    <option key={themeName} value={themeName}>
                                        {themeName.charAt(0).toUpperCase() + themeName.slice(1).replace(/-/g, ' ')}
                                    </option>
                                ))}
                            </select>
                         </div>
                    </div>
                </details>
            )}
        </div>
    );
};

export default Sidebar;