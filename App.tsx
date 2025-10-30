import React, { useState, useEffect, useMemo } from 'react';
import { Tab, Task, DistillationGameEvent, AlchemyState } from './types';
import { THEMES } from './constants';
import { useAppData } from './hooks/useAppData';
import { useTimer } from './hooks/useTimer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import HabitView from './components/HabitView';
import ArchiveView from './components/ArchiveView';
import KanbanView from './components/KanbanView';
import SystemView from './components/SystemView';
import PenaltyView from './components/PenaltyView';
import HelpModal from './components/HelpModal';
import VersionModal from './components/VersionModal';
import { useMediaQuery } from './hooks/useMediaQuery';
import CommandPalette from './components/CommandPalette';
import TaskFocusView from './components/TaskFocusView';
import QuickNoteModal from './components/QuickNoteModal';
import AlchemistsLab from './components/ArchitectWorkshop';
import DistillationGame from './components/FishingGame';
import ConcoctionStatusBar from './components/SymbioteStatusBar';
import TaskReviewModal from './components/TaskReviewModal';


const App: React.FC = () => {
    const [currentTab, setCurrentTab] = useState<Tab>('tasks');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const twoMinTimer = useTimer(120);
    const isMobile = useMediaQuery('(max-width: 1024px)');
    
    // New state for Command Palette, Task Focus and Quick Note
    const [isCommandPaletteVisible, setIsCommandPaletteVisible] = useState(false);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [isQuickNoteVisible, setIsQuickNoteVisible] = useState(false);
    const [isReviewModeActive, setIsReviewModeActive] = useState(false);
    const [taskIdsForReview, setTaskIdsForReview] = useState<string[]>([]);

    const appData = useAppData();
    
    // Destructure gamification state for easier access
    const { distillationGameEvent, alchemyState } = appData.state;
    const { handleDistillationCompletion, handleStabilizeConcoction } = appData.handlers;
    
    const handleStartReview = () => {
        const tasksToReview = appData.state.tasks
            .filter(t => !t.completed && !t.hidden && !t.parentId)
            .sort(() => Math.random() - 0.5) // Shuffle tasks
            .map(t => t.id);
        
        if (tasksToReview.length > 0) {
            setTaskIdsForReview(tasksToReview);
            setIsReviewModeActive(true);
        } else {
            // Optionally, show a message that there are no tasks to review
        }
    };
    
    const tasksForReview = useMemo(() => {
        if (!isReviewModeActive) return [];
        const taskMap = new Map(appData.state.tasks.map(t => [t.id, t]));
        return taskIdsForReview.map(id => taskMap.get(id)).filter((t): t is Task => !!t);
    }, [isReviewModeActive, appData.state.tasks, taskIdsForReview]);

    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Command Palette Toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteVisible(prev => !prev);
            }
            
            // Quick Note Toggle
            if (e.altKey && (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т')) {
                 e.preventDefault();
                 setIsQuickNoteVisible(prev => !prev);
            }

            // Global Escape Handler
            if (e.key === 'Escape') {
                if (isReviewModeActive) {
                    setIsReviewModeActive(false);
                } else if (isQuickNoteVisible) {
                    setIsQuickNoteVisible(false);
                } else if (isCommandPaletteVisible) {
                    setIsCommandPaletteVisible(false);
                } else if (focusTask) {
                    setFocusTask(null);
                } else if (isHelpVisible) {
                    setIsHelpVisible(false);
                } else if (isVersionModalVisible) {
                    setIsVersionModalVisible(false);
                } else if (appData.state.inPenaltyZone) {
                    // Cannot escape penalty zone with Esc
                }
            }
            
            // Quick Add Focus
            if (e.key !== ' ' && e.key !== 'Enter') return;
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    
            const activeElement = document.activeElement as HTMLElement;
            const isInteractiveElementFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'BUTTON' ||
                activeElement.tagName === 'A' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable
            );
    
            if (!isInteractiveElementFocused && !isCommandPaletteVisible && !focusTask && !isQuickNoteVisible) {
                const quickAddInput = document.getElementById('quick-add-input');
                if (quickAddInput && quickAddInput.offsetParent !== null) {
                    e.preventDefault();
                    quickAddInput.focus();
                }
            }
        };
    
        window.addEventListener('keydown', handleGlobalKeyDown);
    
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isCommandPaletteVisible, focusTask, isHelpVisible, isVersionModalVisible, isQuickNoteVisible, appData.state.inPenaltyZone, isReviewModeActive]);

    // Theme logic
    useEffect(() => {
        const root = document.documentElement;
        const theme = appData.state.theme;
        const selectedTheme = THEMES[theme] || THEMES['cyber-noir'];
        // Clear old theme variables
        const allThemeKeys = Object.values(THEMES).flatMap(t => Object.keys(t));
        const uniqueKeys = [...new Set(allThemeKeys)];
        uniqueKeys.forEach(key => root.style.removeProperty(key));

        // Apply new theme
        for (const [key, value] of Object.entries(selectedTheme)) {
            root.style.setProperty(key, value);
        }
        document.body.className = `${theme.replace(/ /g, '-')}-theme`;
    }, [appData.state.theme]);
    
    const handleViewSaved = () => {
        setIsSearchVisible(false);
    };

    const shouldRenderSidebar = (!isFocusMode && !isMobile && !focusTask) || (isMobile && !focusTask);
    const isLayoutSidebarCollapsed = !isSidebarOpen && !isMobile;
    
    if (appData.state.isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] text-[var(--text-color)]">Загрузка...</div>;
    }

    if (appData.state.inPenaltyZone) {
        return <PenaltyView appData={appData} />;
    }

    if (focusTask) {
        return <TaskFocusView task={focusTask} onExit={() => setFocusTask(null)} appData={appData} />;
    }

    const layoutClasses = [
        'app-layout',
        isMobile && isSidebarOpen ? 'sidebar-open' : '',
        isLayoutSidebarCollapsed ? 'sidebar-collapsed' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className="bg-[var(--bg-main)] bg-cover bg-fixed font-sans" style={{ backgroundImage: `var(--bg-overlay, none), var(--bg-image, none)`}}>
             {distillationGameEvent && (
                <DistillationGame
                    event={distillationGameEvent}
                    onCompletion={(taskId, success, value) => handleDistillationCompletion(taskId, success, value)}
                />
            )}
            <div className={`backdrop ${isMobile && isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
             <div className={layoutClasses}>
                {shouldRenderSidebar && (
                    <Sidebar 
                        appData={appData}
                        currentTab={currentTab}
                        onTabChange={(tab) => {
                            setCurrentTab(tab);
                            if (tab !== 'tasks') {
                                appData.handlers.handleApplyView(null);
                            }
                            if (isMobile) setIsSidebarOpen(false);
                        }}
                        birthDate={appData.state.birthDate}
                        onBirthDateChange={appData.handlers.setBirthDate}
                        theme={appData.state.theme}
                        onThemeChange={appData.handlers.setTheme}
                        onVersionModalOpen={() => setIsVersionModalVisible(true)}
                        onStartReview={handleStartReview}
                        isCollapsed={isLayoutSidebarCollapsed}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                )}
                <div className="main-content">
                    <main className="bg-[var(--bg-container)] backdrop-blur-xl saturate-150 p-2 sm:p-6 rounded-2xl border border-[var(--glass-border)] shadow-2xl shadow-[var(--shadow-color)] flex-grow flex flex-col">
                        <Header
                            onThemeChange={appData.handlers.setTheme}
                            currentTab={currentTab}
                            twoMinTimer={twoMinTimer}
                            searchQuery={appData.state.searchQuery}
                            onSearchQueryChange={appData.handlers.setSearchQuery}
                            isFocusMode={isFocusMode}
                            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                            onArchiveTasks={appData.handlers.handleArchiveCompletedTasks}
                            onDeleteAllTasks={appData.handlers.handleDeleteAllTasks}
                            isSearchVisible={isSearchVisible}
                            onSearchVisibleChange={setIsSearchVisible}
                            taskSystemVersion={appData.state.taskSystemVersion}
                            onVersionModalOpen={() => setIsVersionModalVisible(true)}
                            onToggleSidebar={() => setIsSidebarOpen(p => !p)}
                        />
                         {alchemyState.homunculus?.isActive && (
                            <ConcoctionStatusBar 
                                homunculus={alchemyState.homunculus}
                                onStabilize={handleStabilizeConcoction}
                            />
                        )}
                        <div className="flex-grow relative min-h-0">
                            {(currentTab === 'tasks' || currentTab === 'projects') && (
                                <TaskView 
                                    appData={appData} 
                                    currentTab={currentTab} 
                                    isFocusMode={isFocusMode} 
                                    onTabChange={setCurrentTab} 
                                    onViewSaved={handleViewSaved}
                                    onFocusTask={setFocusTask}
                                    onProbeTask={appData.handlers.handleStartDistillation}
                                />
                            )}
                            {currentTab === 'habits' && <HabitView appData={appData} />}
                            {currentTab === 'archive' && <ArchiveView archivedTasksToDisplay={appData.derivedState.archivedTasksToDisplay} onRestoreTask={appData.handlers.handleRestoreTask} />}
                            {currentTab === 'kanban' && <KanbanView appData={appData} onFocusTask={setFocusTask} onProbeTask={appData.handlers.handleStartDistillation} />}
                            {currentTab === 'system' && <SystemView appData={appData} />}
                            {currentTab === 'laboratory' && <AlchemistsLab appData={appData} />}
                        </div>

                    </main>
                </div>
             </div>
             <button
                onClick={() => setIsHelpVisible(true)}
                className="fixed bottom-4 right-4 text-2xl p-3 bg-[var(--glass-bg)] rounded-full shadow-lg text-[var(--text-secondary)] hover:text-[var(--text-color)] z-20 border border-[var(--glass-border)]"
                aria-label="Показать справку"
            >
                ?
            </button>
             <CommandPalette
                isVisible={isCommandPaletteVisible}
                onClose={() => setIsCommandPaletteVisible(false)}
                appData={appData}
                onSelect={(action) => {
                    setIsCommandPaletteVisible(false);
                    if (action.type === 'navigation' && action.tab) {
                        setCurrentTab(action.tab);
                         if (action.tab !== 'tasks') {
                            appData.handlers.handleApplyView(null);
                        }
                    } else if (action.type === 'task') {
                        const task = appData.state.tasks.find(t => t.id === action.id);
                        if (task) setFocusTask(task);
                    } else if (action.type === 'action' && action.perform) {
                        action.perform();
                    }
                }}
            />
            {isReviewModeActive && (
                <TaskReviewModal
                    tasks={tasksForReview}
                    onClose={() => {
                        setIsReviewModeActive(false);
                        setTaskIdsForReview([]);
                    }}
                    appData={appData}
                />
            )}
            <HelpModal isVisible={isHelpVisible} onClose={() => setIsHelpVisible(false)} />
            <VersionModal
                isVisible={isVersionModalVisible}
                onClose={() => setIsVersionModalVisible(false)}
                currentVersion={appData.state.taskSystemVersion}
                onVersionChange={(v) => {
                    appData.handlers.setTaskSystemVersion(v);
                    setIsVersionModalVisible(false);
                }}
            />
            <QuickNoteModal
                isVisible={isQuickNoteVisible}
                onClose={() => setIsQuickNoteVisible(false)}
                onSave={(noteText) => {
                    appData.handlers.handleAddTask(noteText);
                    setIsQuickNoteVisible(false);
                }}
            />
        </div>
    );
};

export default App;