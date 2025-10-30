import React, { useRef, useEffect, useState } from 'react';
import { Tab, TaskSystemVersion } from '../types';

interface HeaderProps {
    onThemeChange: (theme: string) => void;
    currentTab: Tab;
    twoMinTimer: {
        isActive: boolean;
        timeLeft: number;
        toggle: () => void;
    };
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    isFocusMode: boolean;
    onToggleFocusMode: () => void;
    onArchiveTasks: () => void;
    onDeleteAllTasks: () => void;
    isSearchVisible: boolean;
    onSearchVisibleChange: (visible: boolean) => void;
    taskSystemVersion: TaskSystemVersion;
    onVersionModalOpen: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
    onThemeChange, currentTab, twoMinTimer, searchQuery, onSearchQueryChange,
    isFocusMode, onToggleFocusMode, onArchiveTasks, onDeleteAllTasks, isSearchVisible, onSearchVisibleChange,
    taskSystemVersion, onVersionModalOpen, onToggleSidebar
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

    useEffect(() => {
        if (isSearchVisible) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [isSearchVisible]);

    const handleSearchToggle = () => {
        onSearchVisibleChange(!isSearchVisible);
    };
    
    const handleDeleteConfirm = () => {
        onDeleteAllTasks();
        setIsDeleteConfirmVisible(false);
    }

    return (
        <>
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                     {!isFocusMode && (
                        <button onClick={onToggleSidebar} className="text-2xl p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-color)]" title="Свернуть/развернуть сайдбар">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">Mark Forster</h1>
                    {!isFocusMode && currentTab === 'tasks' && (
                        <button 
                            onClick={onVersionModalOpen} 
                            className="bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] rounded-md px-3 py-1 text-sm font-semibold hover:border-[var(--accent-soft)] hidden lg:inline-block"
                            title="Сменить систему"
                        >
                            v{taskSystemVersion}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                     <button onClick={onToggleFocusMode} className="text-lg p-2" title={isFocusMode ? "Выйти из режима фокусировки" : "Режим фокусировки"}>
                        {isFocusMode ? '👁️' : '🎯'}
                    </button>
                     {!isFocusMode && (
                        <>
                            <button onClick={twoMinTimer.toggle} className={`text-xs p-2 rounded-md ${twoMinTimer.isActive ? 'bg-red-500 text-white' : 'bg-[var(--glass-bg)]'}`}>
                                {twoMinTimer.isActive ? `${Math.floor(twoMinTimer.timeLeft / 60)}:${(twoMinTimer.timeLeft % 60).toString().padStart(2, '0')}` : '2 мин'}
                            </button>
                            <button onClick={handleSearchToggle} className="text-lg p-2">🔍</button>
                            <button onClick={onArchiveTasks} className="text-lg p-2 hidden sm:inline-block" title="Архивировать выполненные и отмененные задачи">🗄️</button>
                            <button onClick={() => setIsDeleteConfirmVisible(true)} className="text-lg p-2 text-[var(--undone)] hover:text-red-400" title="Удалить все задачи">💀</button>
                        </>
                    )}
                </div>
            </header>

            {isSearchVisible && !isFocusMode && (
                <div className="relative w-full mb-4 flex-shrink-0">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchQueryChange(e.target.value)}
                        placeholder="Поиск..."
                        className="w-full bg-[var(--glass-bg)] p-2 pr-10 rounded border border-[var(--glass-border)] focus:ring-1 focus:ring-[var(--accent-neon)] focus:outline-none"
                    />
                    <button
                        onClick={() => onSearchVisibleChange(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                        aria-label="Закрыть поиск"
                    >
                        &times;
                    </button>
                </div>
            )}

            {isDeleteConfirmVisible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsDeleteConfirmVisible(false)}>
                    <div className="bg-[var(--bg-container)] p-6 rounded-lg shadow-lg w-full max-w-sm border border-[var(--glass-border)]" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center text-[var(--undone)]">Вы уверены?</h3>
                        <p className="text-center text-[var(--text-secondary)] my-4">Это действие удалит ВСЕ ваши задачи, проекты, привычки, контексты и статистику. Отменить это будет невозможно.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsDeleteConfirmVisible(false)} className="px-6 py-2 bg-[var(--glass-bg)] rounded-md hover:bg-white/10">Отмена</button>
                            <button onClick={handleDeleteConfirm} className="px-6 py-2 bg-[var(--undone)] text-white rounded-md hover:bg-red-700">Удалить всё</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;