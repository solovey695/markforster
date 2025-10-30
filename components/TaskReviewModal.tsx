import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task } from '../types';
import { useAppData } from '../hooks/useAppData';
import { highlightVerbs } from '../utils/highlightVerbs';

type AppData = ReturnType<typeof useAppData>;

interface TaskReviewModalProps {
    tasks: Task[];
    onClose: () => void;
    appData: AppData;
}

const LONG_PRESS_DURATION = 200;

const CONTEXT_MENUS = {
  time: ['#10мин', '#15мин', '#30мин', '#1ч'],
  action: ['#гугл', '#чатбот', '#решить', '#найти', '#утуг', '#выполнить', '#пис'],
  tools: ['#авто', '#ноут', '#интернет', '#телефон'],
  energy: ['#малосил', '#многосил'],
  eisenhower: ['#ВиС', '#ВнеС', '#СнонеВ', '#неВинеС'],
};
type MenuType = keyof typeof CONTEXT_MENUS;

// Sub-component for the context menu
const ContextMenu: React.FC<{
    options: string[];
    position: { top: number; left: number };
    onSelect: (option: string) => void;
    onClose: () => void;
}> = ({ options, position, onSelect, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="absolute z-20 bg-[var(--bg-container)] border border-[var(--glass-border)] rounded-lg shadow-xl p-2 flex flex-wrap gap-2 w-max max-w-xs animate-fade-in-up"
        >
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className="px-3 py-1.5 bg-[var(--glass-bg)] text-[var(--text-color)] text-sm rounded-md hover:bg-[var(--accent-soft)]/20 hover:text-[var(--accent-neon)] transition-colors"
                >
                    {option}
                </button>
            ))}
        </div>
    );
};


const TaskReviewModal: React.FC<TaskReviewModalProps> = ({ tasks, onClose, appData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animation, setAnimation] = useState<'in' | 'out' | null>('in');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');

    const [activeMenu, setActiveMenu] = useState<MenuType | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const editInputRef = useRef<HTMLInputElement>(null);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggeredRef = useRef(false);
    const heldKeyRef = useRef<string | null>(null);
    const buttonRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});

    const { handlers } = appData;

    const currentTask = tasks[currentIndex];
    const isFinished = currentIndex >= tasks.length;

    const handleEditCancel = useCallback(() => {
        setIsEditing(false);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            handleEditCancel();
        }, 5000);
    }, [handleEditCancel]);

    useEffect(() => {
        if (isEditing) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
            resetInactivityTimer();
        } else {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        }
        
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [isEditing, resetInactivityTimer]);
    
    const openContextMenu = (menuType: MenuType, anchorEl: HTMLElement) => {
        const rect = anchorEl.getBoundingClientRect();
        setMenuPosition({ top: rect.top - 10, left: rect.left });
        document.documentElement.style.setProperty('--tw-translate-y', '-100%');
        setActiveMenu(menuType);
    };

    const handleNext = (action: 'keep' | 'complete' | 'delete') => {
        if (!currentTask || activeMenu) return;

        setAnimation('out');

        setTimeout(() => {
            if (action === 'complete') {
                handlers.handleToggleComplete(currentTask.id, false);
            } else if (action === 'delete') {
                handlers.handleDeleteTask(currentTask.id, false);
                // No need to manage local state, props will update.
                // We don't increment index because the next task will shift into the current index.
                setAnimation('in');
                return;
            } else if (action === 'keep') {
                const newText = `${currentTask.text.trim()} |`;
                handlers.handleUpdateTaskText(currentTask.id, newText);
            }

            setCurrentIndex(prev => prev + 1);
            setAnimation('in');
        }, 200);
    };
    
    const handleAddTagFromMenu = (tag: string) => {
        if (!currentTask) return;
    
        handlers.handleAddTag(currentTask.id, tag);
        // No need to update local state; props will update.
        setActiveMenu(null);
    };

    const handleNextWithTag = (tag: string) => {
        if (!currentTask) return;
        
        setActiveMenu(null);
        setAnimation('out');

        setTimeout(() => {
            handlers.handleAddTag(currentTask.id, tag);
            setCurrentIndex(prev => prev + 1);
            setAnimation('in');
        }, 200);
    };

    const handleEditStart = () => {
        if (currentTask && !activeMenu) {
            setIsEditing(true);
            setEditedText(currentTask.text);
        }
    };

    const handleEditSave = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (!currentTask || editedText.trim() === '') {
            setIsEditing(false);
            return;
        }
        const newText = editedText.trim();
        if (newText !== currentTask.text) {
            handlers.handleUpdateTaskText(currentTask.id, newText);
            // No need to update local state; props will update.
        }
        setIsEditing(false);
    };
    
    const handlePressStart = (menuType: MenuType, e: React.MouseEvent | React.TouchEvent) => {
        if (isEditing) return;
        longPressTriggeredRef.current = false;
        holdTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            openContextMenu(menuType, e.currentTarget as HTMLButtonElement);
        }, LONG_PRESS_DURATION);
    };

    const handlePressEnd = (defaultAction: () => void) => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (!longPressTriggeredRef.current) {
            defaultAction();
        }
    };

    const textColorClass = useMemo(() => {
        if (!currentTask) return 'text-[var(--text-color)]';
        const barCount = (currentTask.text.match(/\|/g) || []).length;
        if (barCount >= 7) return 'text-red-600'; // Saturated red
        if (barCount >= 5) return 'text-red-500'; // Red
        if (barCount > 3) return 'text-red-400'; // A little red
        return 'text-[var(--text-color)]';
    }, [currentTask]);


    useEffect(() => {
        const keyActionMap: { [key: string]: () => void } = {
            '1': () => handleNext('keep'),
            '2': () => handleNext('complete'),
            '3': () => handleNext('delete'),
            '4': () => handleEditStart(),
            '5': () => handleNextWithTag('#2мин'),
        };
        const keyMenuMap: { [key: string]: MenuType } = {
            '1': 'time', '2': 'action', '3': 'tools', '4': 'energy', '5': 'eisenhower'
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeMenu) {
                if(e.key === 'Escape') setActiveMenu(null);
                return;
            }
            if (isEditing) {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
                return; 
            }
            if (isFinished) {
                if (e.key === 'Enter' || e.key === 'Escape') onClose();
                return;
            }

            if (e.key === 'Escape') onClose();

            if (Object.keys(keyActionMap).includes(e.key)) {
                if (heldKeyRef.current) return;

                e.preventDefault();
                heldKeyRef.current = e.key;
                longPressTriggeredRef.current = false;

                holdTimerRef.current = setTimeout(() => {
                    longPressTriggeredRef.current = true;
                    const anchorEl = buttonRefs.current[e.key as string];
                    if (anchorEl) {
                        openContextMenu(keyMenuMap[e.key], anchorEl);
                    }
                }, LONG_PRESS_DURATION);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (heldKeyRef.current === e.key) {
                if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                if (!longPressTriggeredRef.current) {
                    keyActionMap[e.key]();
                }
                heldKeyRef.current = null;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, isFinished, tasks, isEditing, editedText, handleEditCancel, onClose, activeMenu]);

    const progressPercentage = tasks.length > 0 ? ((currentIndex) / tasks.length) * 100 : 0;
    
    const animationClasses = {
        'in': 'animate-fade-in-up',
        'out': 'animate-fade-out-down',
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }

                @keyframes fade-out-down {
                    from { opacity: 1; transform: translateY(0) scale(1); }
                    to { opacity: 0; transform: translateY(20px) scale(0.98); }
                }
                .animate-fade-out-down { animation: fade-out-down 0.2s ease-in forwards; }
            `}</style>

            {activeMenu && (
                <ContextMenu
                    options={CONTEXT_MENUS[activeMenu]}
                    position={menuPosition}
                    onSelect={handleAddTagFromMenu}
                    onClose={() => setActiveMenu(null)}
                />
            )}

            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-3xl p-2 text-gray-500 hover:text-white z-10"
                title="Закрыть (Esc)"
            >
                &times;
            </button>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl absolute top-0 left-1/2 -translate-x-1/2 p-4">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                    <span>Прогресс</span>
                    <span>{currentIndex} / {tasks.length}</span>
                </div>
                <div className="w-full bg-[var(--glass-bg)] rounded-full h-2">
                    <div
                        className="bg-[var(--accent-neon)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="w-full max-w-2xl text-center">
                {isFinished ? (
                    <div className="animate-fade-in-up">
                        <h2 className="text-4xl font-bold text-green-400 mb-4">🏆 Обзор завершен!</h2>
                        <p className="text-lg text-gray-300 mb-8">Вы разобрали все задачи. Отличная работа!</p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-[var(--accent-soft)] text-black font-bold rounded-lg hover:bg-[var(--accent-neon)]"
                        >
                            Закрыть
                        </button>
                    </div>
                ) : (
                    currentTask && (
                        <div className={`p-8 bg-[var(--bg-container)] border border-[var(--glass-border)] rounded-xl shadow-2xl shadow-[var(--shadow-color)] ${animation ? animationClasses[animation] : ''}`}>
                            <div className="min-h-[160px] flex flex-col items-center justify-center mb-8">
                                {isEditing ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editedText}
                                        onChange={(e) => {
                                            setEditedText(e.target.value);
                                            resetInactivityTimer();
                                        }}
                                        onBlur={handleEditSave}
                                        className="w-full bg-[var(--glass-bg)] text-3xl font-bold text-center text-[var(--text-color)] p-2 rounded-lg outline-none ring-2 ring-[var(--accent-neon)]"
                                    />
                                ) : (
                                    <>
                                        <h2
                                            className={`text-3xl font-bold text-center transition-colors ${textColorClass}`}
                                            dangerouslySetInnerHTML={{ __html: highlightVerbs(currentTask.text) }}
                                        />
                                        <div className="flex flex-wrap gap-2 justify-center mt-4 h-fit">
                                            {currentTask.tags.split(' ').filter(Boolean).map(tag => (
                                                <span key={tag} className="px-2 py-1 text-xs bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 justify-center gap-4">
                                <button
                                    ref={el => buttonRefs.current['1'] = el}
                                    onMouseDown={(e) => handlePressStart('time', e)}
                                    onMouseUp={() => handlePressEnd(() => handleNext('keep'))}
                                    onTouchStart={(e) => handlePressStart('time', e)}
                                    onTouchEnd={() => handlePressEnd(() => handleNext('keep'))}
                                    className="px-6 py-3 bg-[var(--glass-bg)] text-[var(--text-color)] rounded-lg hover:bg-white/10 border border-[var(--glass-border)]"
                                >
                                    <span className="font-bold">Оставить</span> <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">1</kbd>
                                </button>
                                <button
                                    ref={el => buttonRefs.current['2'] = el}
                                    onMouseDown={(e) => handlePressStart('action', e)}
                                    onMouseUp={() => handlePressEnd(() => handleNext('complete'))}
                                    onTouchStart={(e) => handlePressStart('action', e)}
                                    onTouchEnd={() => handlePressEnd(() => handleNext('complete'))}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
                                >
                                    <span className="font-bold">Выполнить</span> <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">2</kbd>
                                </button>
                                <button
                                    ref={el => buttonRefs.current['3'] = el}
                                    onMouseDown={(e) => handlePressStart('tools', e)}
                                    onMouseUp={() => handlePressEnd(() => handleNext('delete'))}
                                    onTouchStart={(e) => handlePressStart('tools', e)}
                                    onTouchEnd={() => handlePressEnd(() => handleNext('delete'))}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500"
                                >
                                    <span className="font-bold">Удалить</span> <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">3</kbd>
                                </button>
                                <button
                                    ref={el => buttonRefs.current['4'] = el}
                                    onMouseDown={(e) => handlePressStart('energy', e)}
                                    onMouseUp={() => handlePressEnd(handleEditStart)}
                                    onTouchStart={(e) => handlePressStart('energy', e)}
                                    onTouchEnd={() => handlePressEnd(handleEditStart)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                                >
                                    <span className="font-bold">Изменить</span> <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">4</kbd>
                                </button>
                                <button
                                    ref={el => buttonRefs.current['5'] = el}
                                    onMouseDown={(e) => handlePressStart('eisenhower', e)}
                                    onMouseUp={() => handlePressEnd(() => handleNextWithTag('#2мин'))}
                                    onTouchStart={(e) => handlePressStart('eisenhower', e)}
                                    onTouchEnd={() => handlePressEnd(() => handleNextWithTag('#2мин'))}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                                >
                                    <span className="font-bold">+ #2мин</span> <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded">5</kbd>
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TaskReviewModal;