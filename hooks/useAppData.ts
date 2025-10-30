import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, Subtask, Habit, Metrics, Context, SavedView, TaskSystemVersion, KanbanBoard, KanbanColumn, PlayerState, Quest, QuestType, PlayerStats, AlchemyState, DistillationGameEvent, Quintessence, HomunculusState } from '../types';
import { INITIAL_PLAYER_STATE, calculateXpToNextLevel, LEVEL_UP_STAT_POINTS, XP_PER_TASK, XP_PER_STAR, XP_PER_PROJECT, DAILY_QUEST_DEFINITIONS, PENALTY_QUEST_DEFINITION, INITIAL_ALCHEMY_STATE, QUINTESSENCE_CHANCE_PER_TASK, QUINTESSENCE_VALUE_RANGE, TRANSMUTATION_COST, INITIAL_HOMUNCULUS_STATE, TRANSMUTATION_CHARGE_RATE, ALCHEMY_FORMULAE, VOLATILITY_PER_TASK_BASE, VOLATILITY_PER_STAR, VOLATILITY_PER_SUBTASK, VOLATILITY_DECAY_RATE, RESONANCE_THRESHOLD_MIN, RESONANCE_THRESHOLD_MAX, STABILIZE_CONCOCTION_COST, STABILIZE_CONCOCTION_AMOUNT } from '../constants';
import { createId, getDateString, parseMloXml } from '../utils';

declare const LZString: any;

const TASKS_PER_PAGE = 20;
export const V4_TASKS_PER_PAGE = 25;

const defaultKanbanBoard: KanbanBoard = {
    columns: [
        { id: 'col-1-backlog', title: 'Бэклог' },
        { id: 'col-2-inprogress', title: 'В работе' },
        { id: 'col-3-done', title: 'Готово' },
    ]
};

export const useAppData = () => {
    // === STATE MANAGEMENT ===
    const [tasks, setTasks] = useState<Task[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
    
    const [theme, setTheme] = useState<string>('everforest-dark');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Gamification State (Solo Leveling)
    const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [inPenaltyZone, setInPenaltyZone] = useState(false);

    // Gamification State (Alchemy)
    const [alchemyState, setAlchemyState] = useState<AlchemyState>(INITIAL_ALCHEMY_STATE);
    const [distilledTask, setDistilledTask] = useState<Task | null>(null);
    const [distillationGameEvent, setDistillationGameEvent] = useState<DistillationGameEvent | null>(null);
    
    const [currentParentTask, setCurrentParentTask] = useState<Task | null>(null);
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [birthDate, setBirthDate] = useState<string | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [contexts, setContexts] = useState<Context[]>([]);
    const [activeContextIds, setActiveContextIds] = useState<string[]>([]);
    const [excludedContextIds, setExcludedContextIds] = useState<string[]>([]);
    const [contextLogic, setContextLogic] = useState<'OR' | 'AND'>('OR');
    const [isFilteringByNoNextAction, setIsFilteringByNoNextAction] = useState(false);
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    // Kanban state
    const [kanbanBoard, setKanbanBoard] = useState<KanbanBoard>(defaultKanbanBoard);

    // Version-specific state
    const [taskSystemVersion, setTaskSystemVersion] = useState<TaskSystemVersion>(1);
    const [v2LineTaskId, setV2LineTaskId] = useState<string | null>(null);
    const [v3ActiveTaskIds, setV3ActiveTaskIds] = useState<string[]>([]);
    const [v5ScanIndex, setV5ScanIndex] = useState<number | null>(null);
    const [v6Mode, setV6Mode] = useState<'reverse' | 'forward'>('reverse');
    const [v6LineTaskId, setV6LineTaskId] = useState<string | null>(null);
    const [v7LineTaskId, setV7LineTaskId] = useState<string | null>(null);


    // === REFS ===
    const historyRef = useRef<string[]>([]);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialLoad = useRef(true);

    // === DATA PERSISTENCE LOGIC ===
    const saveToHistory = useCallback(() => {
        const stateToSave = JSON.stringify({ tasks, archivedTasks, deletedTasks, kanbanBoard });
        historyRef.current.push(stateToSave);
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
        }
    }, [tasks, archivedTasks, deletedTasks, kanbanBoard]);
    
    const saveState = useCallback(() => {
        if (isLoading || isInitialLoad.current) return;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            try {
                if (typeof LZString === 'undefined') {
                    console.error("LZString library not loaded, cannot save state.");
                    return;
                }
                const stateToSave = {
                    tasks, habits, archivedTasks, deletedTasks, theme, birthDate,
                    currentMonth: currentMonth.toISOString(),
                    contexts,
                    savedViews,
                    playerState, quests, inPenaltyZone,
                    alchemyState,
                    taskSystemVersion, v2LineTaskId, v3ActiveTaskIds, v5ScanIndex, v6Mode, v6LineTaskId,
                    v7LineTaskId,
                    kanbanBoard,
                };
                const stringifiedState = JSON.stringify(stateToSave);
                const compressed = LZString.compressToUTF16(stringifiedState);
                localStorage.setItem('productivity_os_state', compressed);
            } catch (error) {
                console.error("Failed to save state:", error);
            }
        }, 500);
    }, [tasks, habits, archivedTasks, deletedTasks, theme, birthDate, currentMonth, contexts, savedViews, isLoading, taskSystemVersion, v2LineTaskId, v3ActiveTaskIds, v5ScanIndex, v6Mode, v6LineTaskId, v7LineTaskId, kanbanBoard, playerState, quests, inPenaltyZone, alchemyState]);

    useEffect(() => {
        saveState();
    }, [saveState]);

    useEffect(() => {
        const savedStateCompressed = localStorage.getItem('productivity_os_state');
        if (savedStateCompressed) {
            try {
                if (typeof LZString === 'undefined') {
                    throw new Error("LZString library not loaded, cannot decompress state.");
                }
                const decompressed = LZString.decompressFromUTF16(savedStateCompressed);
                if (!decompressed) throw new Error("Decompression failed, resulted in null or empty string.");
                const loadedState = JSON.parse(decompressed);
                
                let loadedTasks = loadedState.tasks || [];
                setHabits(loadedState.habits || []);
                setArchivedTasks(loadedState.archivedTasks || []);
                setDeletedTasks(loadedState.deletedTasks || []);
                
                setPlayerState(loadedState.playerState || INITIAL_PLAYER_STATE);
                setQuests(loadedState.quests || []);
                setInPenaltyZone(loadedState.inPenaltyZone || false);
                // MIGRATION: Check for old neuralArchitectState and convert it
                const gamificationState = loadedState.alchemyState || loadedState.neuralArchitectState || INITIAL_ALCHEMY_STATE;
                if (loadedState.neuralArchitectState) {
                    // @ts-ignore - migrating old properties
                    gamificationState.quintessence = gamificationState.anomalousData;
                    // @ts-ignore - migrating old properties
                    gamificationState.homunculus = gamificationState.symbiote;
                    if (gamificationState.homunculus) {
                        // FIX: Completed the truncated file. This block was left open, causing a syntax error.
                        // MIGRATION: Ensure volatility exists
                        if (gamificationState.homunculus.volatility === undefined) {
                            gamificationState.homunculus.volatility = 0;
                        }
                    }
                    // @ts-ignore
                    delete gamificationState.anomalousData;
                    // @ts-ignore
                    delete gamificationState.symbiote;
                }
                setAlchemyState(gamificationState);

                setTheme(loadedState.theme || 'everforest-dark');
                setBirthDate(loadedState.birthDate || null);
                if (loadedState.currentMonth) {
                    setCurrentMonth(new Date(loadedState.currentMonth));
                }
                setContexts(loadedState.contexts || []);
                setSavedViews(loadedState.savedViews || []);
                
                setTaskSystemVersion(loadedState.taskSystemVersion || 1);
                setV2LineTaskId(loadedState.v2LineTaskId || null);
                setV3ActiveTaskIds(loadedState.v3ActiveTaskIds || []);
                setV5ScanIndex(loadedState.v5ScanIndex !== undefined ? loadedState.v5ScanIndex : null);
                setV6Mode(loadedState.v6Mode || 'reverse');
                setV6LineTaskId(loadedState.v6LineTaskId || null);
                setV7LineTaskId(loadedState.v7LineTaskId || null);
                setKanbanBoard(loadedState.kanbanBoard || defaultKanbanBoard);
                
                // Sort tasks by originalIndex after loading
                setTasks(loadedTasks.sort((a: Task, b: Task) => a.originalIndex - b.originalIndex));

            } catch (error) {
                console.error("Failed to load state from localStorage:", error);
                localStorage.removeItem('productivity_os_state'); // Clear corrupted state
            }
        }
        setIsLoading(false);
        isInitialLoad.current = false;

        // Daily Quest Logic - should be outside the if(savedStateCompressed) block
        const today = getDateString(new Date());
        const lastQuestDate = localStorage.getItem('last_quest_date');

        if (lastQuestDate !== today) {
            // Check for penalty
            const incompleteYesterdayQuests = quests.filter(q => q.type === 'daily' && q.progress < q.progressGoal && q.date !== today);
            if (incompleteYesterdayQuests.length > 0) {
                setInPenaltyZone(true);
            }
            
            // Generate new daily quests
            const newDailyQuests = DAILY_QUEST_DEFINITIONS.map(def => ({
                ...def,
                id: createId(),
                isComplete: false,
                progress: 0,
                claimed: false,
                date: today,
            }));
            
            setQuests(prevQuests => [...prevQuests.filter(q => q.type !== 'daily'), ...newDailyQuests]);
            localStorage.setItem('last_quest_date', today);
        }
        
        // Alchemy background processes
        const alchemyInterval = setInterval(() => {
            setAlchemyState(prev => {
                const now = Date.now();
                const lastTimestamp = prev.lastTransmutationTimestamp || now;
                const elapsed = now - lastTimestamp;

                // Transmutation charge regeneration
                const maxCharge = prev.researchedFormulae.includes('transmutation-catalyst-1') ? 2 : 1;
                const newCharge = Math.min(maxCharge, prev.transmutationCharge + (elapsed * TRANSMUTATION_CHARGE_RATE));
                
                // Homunculus state updates (volatility decay, duration check)
                let newHomunculus = prev.homunculus;
                if (newHomunculus && newHomunculus.isActive) {
                    const activationTime = newHomunculus.activationTime || now;
                    // Check duration
                    if (now - activationTime >= newHomunculus.duration) {
                        newHomunculus = { ...newHomunculus, isActive: false };
                    } else {
                        // Decay volatility
                        const decayRate = VOLATILITY_DECAY_RATE * (elapsed / (60 * 1000)); // decay per minute
                        const newVolatility = Math.max(0, newHomunculus.volatility - decayRate);
                        newHomunculus = { ...newHomunculus, volatility: newVolatility };
                    }
                }
                
                return { ...prev, transmutationCharge: newCharge, lastTransmutationTimestamp: now, homunculus: newHomunculus };
            });
        }, 60 * 1000); // every minute

        return () => clearInterval(alchemyInterval);
    }, []); // Empty dependency array ensures this runs only once on mount

    // === GAMIFICATION LOGIC ===
    const addXp = useCallback((amount: number) => {
        setPlayerState(prev => {
            let newXp = prev.xp + amount * (1 + prev.stats.intelligence / 100);
            let newLevel = prev.level;
            let newXpToNext = prev.xpToNextLevel;
            let newUnallocated = prev.unallocatedStatPoints;

            while (newXp >= newXpToNext) {
                newXp -= newXpToNext;
                newLevel++;
                newUnallocated += LEVEL_UP_STAT_POINTS;
                newXpToNext = calculateXpToNextLevel(newLevel);
            }

            return { ...prev, xp: newXp, level: newLevel, xpToNextLevel: newXpToNext, unallocatedStatPoints: newUnallocated };
        });
    }, []);

    const updateQuestProgress = useCallback((type: 'completeTask' | 'completeStarredTask' | 'completeProject') => {
        const today = getDateString(new Date());
        setQuests(prev => prev.map(q => {
            if (q.date !== today || q.isComplete) return q;

            let shouldUpdate = false;
            if (type === 'completeTask' && q.title.includes('Выполнить 5 задач')) {
                shouldUpdate = true;
            } else if (type === 'completeStarredTask' && q.title.includes('Завершить важную задачу')) {
                shouldUpdate = true;
            } else if (type === 'completeProject' && q.title.includes('Спринт')) { // Assuming a project counts for the sprint for now
                shouldUpdate = true;
            }
            
            if (shouldUpdate) {
                const newProgress = q.progress + 1;
                const isComplete = newProgress >= q.progressGoal;
                return { ...q, progress: newProgress, isComplete };
            }
            return q;
        }));
    }, []);
    
    // === HANDLERS ===
    const handleAddTask = useCallback((text: string, columnId?: string) => {
        saveToHistory();
        const newTasks = text.split('\n').filter(t => t.trim() !== '').map((taskText, index) => {
            const starMatch = taskText.match(/\*(\d)/);
            const starCount = starMatch ? parseInt(starMatch[1], 10) : 0;
            const cleanedText = taskText.replace(/\s*\*(\d)/, '').trim();

            const isProject = cleanedText.startsWith('[P:');
            const maxIndex = tasks.length > 0 ? Math.max(...tasks.map(t => t.originalIndex)) : -1;
            
            const newTask: Task = {
                id: createId(),
                text: cleanedText,
                tags: cleanedText.match(/#\S+/g)?.join(' ') || '',
                starCount: starCount,
                completed: false,
                undone: false,
                repeated: false,
                hidden: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                originalIndex: maxIndex + 1 + index,
                subtasks: [],
                parentId: null,
                note: '',
                isCollapsed: true,
                priorityDetails: { why: '', vision: '', brainstorm: '', organization: '' },
                priorityDetailsOpen: false,
                brainstormTimerRunning: false,
                brainstormTimerPaused: false,
                brainstormTimeLeft: 300,
                v7list: 'main',
                kanbanColumnId: columnId || kanbanBoard.columns[0]?.id,
                kanbanOrder: 0, // Will be re-ordered below
            };
            return newTask;
        });

        setTasks(prevTasks => {
            const columnTasks = prevTasks.filter(t => t.kanbanColumnId === (columnId || kanbanBoard.columns[0]?.id));
            newTasks.forEach((nt, i) => nt.kanbanOrder = columnTasks.length + i);
            return [...prevTasks, ...newTasks];
        });
    }, [tasks, kanbanBoard.columns]);

    const handleToggleComplete = useCallback((id: string, isSubtask: boolean) => {
        saveToHistory();
        let xpGained = 0;
        let completedTask: Task | null = null;

        const newTasks = tasks.map(task => {
            if (isSubtask) {
                if (task.subtasks.some(st => st.id === id)) {
                    const newSubtasks = task.subtasks.map(st => {
                        if (st.id === id) {
                            if (!st.completed) {
                                xpGained += XP_PER_TASK / 2; // Half XP for subtask
                            }
                            return { ...st, completed: !st.completed, completedAt: new Date().toISOString() };
                        }
                        return st;
                    });
                    return { ...task, subtasks: newSubtasks, updatedAt: new Date().toISOString() };
                }
            } else if (task.id === id) {
                const isCompleting = !task.completed;
                if (isCompleting) {
                    completedTask = task;
                    xpGained += XP_PER_TASK + (task.starCount * XP_PER_STAR);
                    if (task.text.includes('[P:')) {
                        xpGained += XP_PER_PROJECT;
                        updateQuestProgress('completeProject');
                    }
                    updateQuestProgress('completeTask');
                    if(task.starCount > 0) updateQuestProgress('completeStarredTask');
                    
                    // Alchemy Quintessence Chance
                    if (Math.random() < QUINTESSENCE_CHANCE_PER_TASK) {
                        const value = Math.floor(Math.random() * (QUINTESSENCE_VALUE_RANGE.max - QUINTESSENCE_VALUE_RANGE.min + 1)) + QUINTESSENCE_VALUE_RANGE.min;
                        setAlchemyState(prev => ({
                            ...prev,
                            quintessence: [...prev.quintessence, { id: createId(), collectedAt: new Date().toISOString(), value, source: task.text }]
                        }));
                    }
                }
                return { ...task, completed: isCompleting, undone: false, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            }
            return task;
        });

        if (xpGained > 0) addXp(xpGained);
        
        if (completedTask && alchemyState.homunculus?.isActive) {
            setAlchemyState(prev => {
                if (!prev.homunculus) return prev;
                let volatilityIncrease = VOLATILITY_PER_TASK_BASE;
                volatilityIncrease += completedTask!.starCount * VOLATILITY_PER_STAR;
                volatilityIncrease += completedTask!.subtasks.length * VOLATILITY_PER_SUBTASK;
                const formulaEffect = prev.researchedFormulae.includes('potion-of-calm-1') ? 0.8 : 1;
                const newVolatility = prev.homunculus.volatility + volatilityIncrease * formulaEffect;
                return { ...prev, homunculus: { ...prev.homunculus, volatility: newVolatility } };
            });
        }

        setTasks(newTasks);
    }, [tasks, addXp, updateQuestProgress, alchemyState.homunculus]);
    
    const handleDeleteTask = useCallback((id: string, isSubtask: boolean) => {
        saveToHistory();
        setTasks(prevTasks => {
            if (isSubtask) {
                return prevTasks.map(t => ({
                    ...t,
                    subtasks: t.subtasks.filter(st => st.id !== id)
                }));
            }
            const taskToDelete = prevTasks.find(t => t.id === id);
            if (!taskToDelete) return prevTasks;
            setDeletedTasks(prev => [...prev, taskToDelete]);
            return prevTasks.filter(t => t.id !== id && t.parentId !== id);
        });
    }, []);

    const handleUndoTask = useCallback((taskId: string) => {
        saveToHistory();
        setTasks(tasks.map(t => t.id === taskId ? { ...t, undone: true, completed: false } : t));
    }, [tasks]);

    const handleStarTask = useCallback((taskId: string) => {
        saveToHistory();
        setTasks(tasks.map(t => t.id === taskId ? { ...t, starCount: (t.starCount + 1) % 4, starredAt: new Date().toISOString() } : t));
    }, [tasks]);
    
    const handleRepeatTask = useCallback((taskId: string) => {
        saveToHistory();
        const taskToRepeat = tasks.find(t => t.id === taskId);
        if (!taskToRepeat) return;
        
        const maxIndex = Math.max(...tasks.map(t => t.originalIndex));
        
        const repeatedTask: Task = {
            ...taskToRepeat,
            id: createId(),
            completed: false,
            undone: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            originalIndex: maxIndex + 1,
            subtasks: taskToRepeat.subtasks.map(st => ({...st, id: createId(), completed: false}))
        };
        setTasks([...tasks, repeatedTask]);
    }, [tasks]);

    const handleUpdateTaskText = useCallback((taskId: string, newText: string) => {
        saveToHistory();
        setTasks(tasks.map(t => t.id === taskId ? { ...t, text: newText, tags: newText.match(/#\S+/g)?.join(' ') || '' } : t));
    }, [tasks]);

    const handleUpdateTaskNote = useCallback((taskId: string, newNote: string) => {
        saveToHistory();
        setTasks(tasks.map(t => t.id === taskId ? { ...t, note: newNote } : t));
    }, [tasks]);

    const handleAddSubtask = useCallback((parentId: string, subtaskText: string) => {
        saveToHistory();
        const newSubtask: Subtask = {
            id: createId(),
            text: subtaskText,
            completed: false,
            undone: false
        };
        setTasks(tasks.map(t => t.id === parentId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t));
    }, [tasks]);

    const handleAddTag = useCallback((taskId: string, newTag: string) => {
        if (!newTag.startsWith('#')) newTag = '#' + newTag;
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                const tags = new Set(task.tags.split(' ').filter(Boolean));
                tags.add(newTag);
                const newTags = Array.from(tags).join(' ');
                return { ...task, tags: newTags, text: `${task.text} ${newTag}`.trim() };
            }
            return task;
        }));
    }, []);

    const handleRemoveTag = useCallback((taskId: string, tagToRemove: string) => {
        setTasks(tasks.map(task => {
            if (task.id === taskId) {
                const newTags = task.tags.split(' ').filter(t => t !== tagToRemove).join(' ');
                const newText = task.text.replace(tagToRemove, '').trim();
                return { ...task, tags: newTags, text: newText };
            }
            return task;
        }));
    }, []);
    
    const handleToggleCollapse = useCallback((taskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, isCollapsed: !t.isCollapsed } : t));
    }, [tasks]);

    const handleTogglePriorityDetails = useCallback((taskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, priorityDetailsOpen: !t.priorityDetailsOpen } : t));
    }, [tasks]);

    const handleUpdatePriorityDetail = useCallback((taskId: string, field: keyof Task['priorityDetails'], value: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, priorityDetails: { ...t.priorityDetails, [field]: value } } : t));
    }, [tasks]);

    const handleBrainstormTimerToggle = useCallback((taskId: string) => {
        // This would require an interval, which is complex for this structure. 
        // A full implementation would be needed. This is a simplified version.
        setTasks(tasks.map(t => {
            if (t.id === taskId) {
                const isRunning = !t.brainstormTimerRunning || t.brainstormTimerPaused;
                return { ...t, brainstormTimerRunning: isRunning, brainstormTimerPaused: false };
            }
            return t;
        }));
    }, [tasks]);
    
    const handleArchiveCompletedTasks = useCallback(() => {
        saveToHistory();
        const tasksToKeep = tasks.filter(t => !t.completed && !t.undone);
        const tasksToArchive = tasks.filter(t => t.completed || t.undone);
        setTasks(tasksToKeep);
        setArchivedTasks(prev => [...prev, ...tasksToArchive]);
    }, [tasks]);
    
    const handleDeleteAllTasks = useCallback(() => {
        if (window.confirm("Вы уверены, что хотите удалить все данные? Это действие необратимо.")) {
            setTasks([]);
            setHabits([]);
            setArchivedTasks([]);
            setDeletedTasks([]);
            setContexts([]);
            setSavedViews([]);
            setPlayerState(INITIAL_PLAYER_STATE);
            setQuests([]);
            setAlchemyState(INITIAL_ALCHEMY_STATE);
            setSearchQuery('');
            setActiveTagFilter(null);
            setCurrentParentTask(null);
            setV3ActiveTaskIds([]);
            setV5ScanIndex(null);
            setV6Mode('reverse');
            setV7LineTaskId(null);
            localStorage.removeItem('productivity_os_state');
        }
    }, []);
    
    const handleRestoreTask = useCallback((taskId: string) => {
        saveToHistory();
        const taskToRestore = archivedTasks.find(t => t.id === taskId);
        if (taskToRestore) {
            setArchivedTasks(archivedTasks.filter(t => t.id !== taskId));
            setTasks(prev => [...prev, { ...taskToRestore, completed: false, undone: false }]);
        }
    }, [archivedTasks]);
    
    const handleDrop = useCallback((draggedItem: Task | Subtask, dragOverItem: Task | Subtask) => {
        if (draggedItem.id === dragOverItem.id) return;
        
        saveToHistory();
        setTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const dragIndex = newTasks.findIndex(t => t.id === draggedItem.id);
            const hoverIndex = newTasks.findIndex(t => t.id === dragOverItem.id);
            
            if (dragIndex === -1 || hoverIndex === -1) return prevTasks;

            const [dragged] = newTasks.splice(dragIndex, 1);
            newTasks.splice(hoverIndex, 0, dragged);
            
            // Re-assign originalIndex for stability
            return newTasks.map((t, i) => ({ ...t, originalIndex: i }));
        });
    }, []);

    // V2-V8 Handlers
    const handleV2ResetScan = useCallback(() => setV2LineTaskId(tasks.filter(t => !t.completed).pop()?.id || null), [tasks]);
    const handleV3SelectTask = useCallback((taskId: string) => {
        setV3ActiveTaskIds(prev => {
            if (prev.includes(taskId)) return prev.filter(id => id !== taskId);
            if (prev.length < 3) return [...prev, taskId];
            return prev;
        });
    }, []);
    const handleV3ClearSelection = useCallback(() => setV3ActiveTaskIds([]), []);
    const handleV4DismissPage = useCallback(() => {
        const tasksPerPage = V4_TASKS_PER_PAGE;
        const startIndex = (currentPage - 1) * tasksPerPage;
        const endIndex = startIndex + tasksPerPage;
        const pageTasks = tasks.slice(startIndex, endIndex);
        setTasks(tasks.map(t => pageTasks.some(pt => pt.id === t.id) ? { ...t, hidden: true } : t));
    }, [tasks, currentPage]);
    const handleV4RestoreDismissed = useCallback(() => setTasks(tasks.map(t => ({...t, hidden: false}))), [tasks]);
    const handleV5StartNewDay = useCallback(() => {
        const activeTasks = tasks.filter(t => !t.completed && !t.undone);
        setV5ScanIndex(activeTasks.length);
    }, [tasks]);
    const handleV6StartNewDay = useCallback(() => setV6LineTaskId(tasks.filter(t => !t.completed).pop()?.id || null), [tasks]);
    const handleV7NewCycle = useCallback(() => {
        const activeTasks = tasks.filter(t => t.v7list === 'main' && !t.completed);
        const lastNewTask = [...activeTasks].sort((a,b) => b.originalIndex - a.originalIndex)[0];
        if (lastNewTask) {
            setV7LineTaskId(lastNewTask.id);
        }
    }, [tasks]);
    const handleV7DismissOldTasks = useCallback(() => {
        const lineTask = tasks.find(t => t.id === v7LineTaskId);
        if (!lineTask) return;
        setTasks(tasks.map(t => t.originalIndex <= lineTask.originalIndex && t.v7list === 'main' ? {...t, hidden: true} : t));
    }, [tasks, v7LineTaskId]);
    const handleV7MarkUnfinished = useCallback((taskId: string) => setTasks(tasks.map(t => t.id === taskId ? {...t, v7list: 'unfinished', completed: false} : t)), [tasks]);
    const handleV7MarkRecurring = useCallback((taskId: string) => setTasks(tasks.map(t => t.id === taskId ? {...t, v7list: 'recurring', completed: false} : t)), [tasks]);

    // Context Handlers
    const handleAddContext = useCallback((name: string, tags: string[]) => setContexts(prev => [...prev, {id: createId(), name, tags}]), []);
    const handleCycleContextState = useCallback((contextId: string) => {
        if (activeContextIds.includes(contextId)) {
            setActiveContextIds(prev => prev.filter(id => id !== contextId));
            setExcludedContextIds(prev => [...prev, contextId]);
        } else if (excludedContextIds.includes(contextId)) {
            setExcludedContextIds(prev => prev.filter(id => id !== contextId));
        } else {
            setActiveContextIds(prev => [...prev, contextId]);
        }
    }, [activeContextIds, excludedContextIds]);
    const handleToggleNoNextActionFilter = useCallback(() => setIsFilteringByNoNextAction(prev => !prev), []);
    const handleSaveView = useCallback((name: string, icon: string) => {
        const newView: SavedView = {
            id: createId(), name, icon, searchQuery, activeTagFilter, activeContextIds, excludedContextIds, contextLogic
        };
        setSavedViews(prev => [...prev, newView]);
    }, [searchQuery, activeTagFilter, activeContextIds, excludedContextIds, contextLogic]);
    const handleApplyView = useCallback((viewId: string | null) => {
        setActiveViewId(viewId);
        if (!viewId) {
            setSearchQuery('');
            setActiveTagFilter(null);
            setActiveContextIds([]);
            setExcludedContextIds([]);
            return;
        }
        const view = savedViews.find(v => v.id === viewId);
        if (view) {
            setSearchQuery(view.searchQuery);
            setActiveTagFilter(view.activeTagFilter);
            setActiveContextIds(view.activeContextIds);
            setExcludedContextIds(view.excludedContextIds);
            setContextLogic(view.contextLogic);
        }
    }, [savedViews]);
    const handleDeleteView = useCallback((viewId: string) => setSavedViews(prev => prev.filter(v => v.id !== viewId)), []);
    
    // Kanban Handlers
    const handleAddKanbanColumn = useCallback((title: string) => setKanbanBoard(prev => ({...prev, columns: [...prev.columns, {id: createId(), title}]})), []);
    const handleUpdateKanbanColumn = useCallback((columnId: string, title: string) => setKanbanBoard(prev => ({...prev, columns: prev.columns.map(c => c.id === columnId ? {...c, title} : c)})), []);
    const handleDeleteKanbanColumn = useCallback((columnId: string) => {
        setKanbanBoard(prev => {
            const backlogId = prev.columns[0]?.id;
            if (!backlogId || backlogId === columnId) return prev; // Cannot delete backlog
            
            setTasks(t => t.map(task => task.kanbanColumnId === columnId ? {...task, kanbanColumnId: backlogId} : task));
            return { ...prev, columns: prev.columns.filter(c => c.id !== columnId) };
        });
    }, []);
    const handleMoveTaskInKanban = useCallback((taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => {
        setTasks(prevTasks => {
            const task = prevTasks.find(t => t.id === taskId);
            if (!task) return prevTasks;
    
            const tasksInSourceCol = prevTasks.filter(t => t.kanbanColumnId === sourceColumnId);
            const tasksInDestCol = prevTasks.filter(t => t.kanbanColumnId === destColumnId);
    
            // Remove from source
            tasksInSourceCol.splice(tasksInSourceCol.findIndex(t => t.id === taskId), 1);
            tasksInSourceCol.forEach((t, i) => t.kanbanOrder = i);
    
            // Add to destination
            if (sourceColumnId === destColumnId) {
                tasksInSourceCol.splice(destIndex, 0, task);
                tasksInSourceCol.forEach((t, i) => t.kanbanOrder = i);
            } else {
                tasksInDestCol.splice(destIndex, 0, task);
                tasksInDestCol.forEach((t, i) => t.kanbanOrder = i);
            }
    
            task.kanbanColumnId = destColumnId;
    
            return [...prevTasks]; // Trigger re-render
        });
    }, []);
    
    // Gamification Handlers
    const allocateStatPoint = useCallback((stat: keyof PlayerStats) => {
        setPlayerState(prev => {
            if (prev.unallocatedStatPoints > 0) {
                return {
                    ...prev,
                    stats: {...prev.stats, [stat]: prev.stats[stat] + 1},
                    unallocatedStatPoints: prev.unallocatedStatPoints - 1
                };
            }
            return prev;
        });
    }, []);
    
    const claimQuestReward = useCallback((questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest && quest.progress >= quest.progressGoal && !quest.claimed) {
            addXp(quest.xpReward);
            setQuests(prev => prev.map(q => q.id === questId ? {...q, claimed: true} : q));
        }
    }, [quests, addXp]);

    const acceptPenaltyQuest = useCallback((penaltyTasks: Task[]) => {
        const penaltyQuestToAdd: Quest = {
            ...PENALTY_QUEST_DEFINITION,
            id: createId(),
            isComplete: false,
            progress: 0,
            claimed: false,
            xpReward: 0,
            date: getDateString(new Date()),
        };
        setQuests(prev => [...prev, penaltyQuestToAdd]);
        setInPenaltyZone(false); // They have accepted, now they must do it.
        // Logic to highlight/focus on penaltyTasks would be in the UI component
    }, []);
    
    const handleStartDistillation = useCallback((task: Task) => {
        const targetValue = 20 + task.note.length / 10 + task.subtasks.length * 5;
        const initialVariance = Math.max(10, 50 - (task.starCount * 5));
        setDistillationGameEvent({ taskId: task.id, targetValue, initialVariance });
    }, []);

    const handleDistillationCompletion = useCallback((taskId: string, success: boolean, value: number) => {
        setDistillationGameEvent(null);
        if (success) {
            setAlchemyState(prev => ({
                ...prev,
                quintessence: [...prev.quintessence, {id: createId(), collectedAt: new Date().toISOString(), value, source: `Distillation: ${taskId}`}]
            }));
        }
    }, []);

    const handleStabilizeConcoction = useCallback(() => {
        setAlchemyState(prev => {
            const totalQuintessence = prev.quintessence.reduce((sum, item) => sum + item.value, 0);
            if (totalQuintessence < STABILIZE_CONCOCTION_COST || !prev.homunculus) return prev;

            const remainingQuintessence = totalQuintessence - STABILIZE_CONCOCTION_COST;
            // Simple approach: remove from latest quintessence items. A better one would be FIFO.
            const newQuintessence: Quintessence[] = [];
            let collected = 0;
            for(const q of [...prev.quintessence].reverse()) {
                if(collected < remainingQuintessence) {
                    newQuintessence.unshift(q);
                    collected += q.value;
                }
            }
            
            const newVolatility = Math.max(0, prev.homunculus.volatility - STABILIZE_CONCOCTION_AMOUNT);
            return {
                ...prev,
                quintessence: newQuintessence,
                homunculus: { ...prev.homunculus, volatility: newVolatility }
            };
        });
    }, []);

    const handlePerformTransmutation = useCallback(() => {
        setAlchemyState(prev => {
            const totalQuintessence = prev.quintessence.reduce((sum, item) => sum + item.value, 0);
            if (totalQuintessence < TRANSMUTATION_COST) return prev;
            
            const remainingQuintessenceValue = totalQuintessence - TRANSMUTATION_COST;
            const newQuintessence: Quintessence[] = [];
            let collected = 0;
             for(const q of [...prev.quintessence].reverse()) {
                if(collected < remainingQuintessenceValue) {
                    newQuintessence.unshift(q);
                    collected += q.value;
                }
            }
            
            if (prev.homunculus) {
                // upgrade homunculus, for now just a placeholder
                return { ...prev, quintessence: newQuintessence };
            } else {
                return { ...prev, quintessence: newQuintessence, homunculus: INITIAL_HOMUNCULUS_STATE };
            }
        });
    }, []);
    
    const handleAwakenHomunculus = useCallback(() => {
        setAlchemyState(prev => {
            if (!prev.homunculus || prev.homunculus.isActive) return prev;
            const durationMultiplier = prev.researchedFormulae.includes('homunculus-stabilizer-1') ? 1.5 : 1;
            return {
                ...prev,
                homunculus: {
                    ...prev.homunculus,
                    isActive: true,
                    activationTime: Date.now(),
                    duration: INITIAL_HOMUNCULUS_STATE.duration * durationMultiplier
                }
            }
        });
    }, []);

    const handleResearchFormula = useCallback((formulaId: string) => {
        setAlchemyState(prev => {
            const formula = ALCHEMY_FORMULAE.find(f => f.id === formulaId);
            const totalQuintessence = prev.quintessence.reduce((sum, item) => sum + item.value, 0);
            if (!formula || totalQuintessence < formula.cost || prev.researchedFormulae.includes(formulaId)) return prev;

            const remainingQuintessenceValue = totalQuintessence - formula.cost;
            const newQuintessence: Quintessence[] = [];
            let collected = 0;
             for(const q of [...prev.quintessence].reverse()) {
                if(collected < remainingQuintessenceValue) {
                    newQuintessence.unshift(q);
                    collected += q.value;
                }
            }
            
            return {
                ...prev,
                quintessence: newQuintessence,
                researchedFormulae: [...prev.researchedFormulae, formulaId]
            }
        });
    }, []);
    
    const handleImportMloTasks = useCallback(async (file: File): Promise<number> => {
        const xmlString = await file.text();
        const newMloTasks = await parseMloXml(xmlString, tasks);
        if (newMloTasks.length > 0) {
            setTasks(prev => [...prev, ...newMloTasks]);
        }
        return newMloTasks.length;
    }, [tasks]);

    const handlers = useMemo(() => ({
        handleAddTask, handleToggleComplete, handleDeleteTask, handleUndoTask, handleStarTask, handleRepeatTask,
        handleUpdateTaskText, handleUpdateTaskNote, handleAddSubtask, handleAddTag, handleRemoveTag,
        setCurrentParentTask, handleToggleCollapse, handleTogglePriorityDetails, handleUpdatePriorityDetail,
        handleBrainstormTimerToggle, handleArchiveCompletedTasks, handleDeleteAllTasks, handleRestoreTask, handleDrop,
        setActiveTagFilter, setSearchQuery, setCurrentPage, setActiveTaskId,
        handleAddHabit: (name: string, color: string) => setHabits(prev => [...prev, {id: createId(), name, color, states: {}}]),
        handleUpdateHabit: (id: string, name?: string, color?: string) => setHabits(prev => prev.map(h => h.id === id ? {...h, name: name ?? h.name, color: color ?? h.color} : h)),
        handleDeleteHabit: (id: string) => setHabits(prev => prev.filter(h => h.id !== id)),
        handleHabitClick: (habitId: string, dayIndex: number, monthKey: string, daysInMonth: number) => {
            setHabits(prev => prev.map(h => {
                if (h.id !== habitId) return h;
                const newStates = { ...h.states };
                if (!newStates[monthKey]) newStates[monthKey] = Array(daysInMonth).fill(0);
                const currentState = newStates[monthKey][dayIndex];
                newStates[monthKey][dayIndex] = ((currentState + 1) % 3) as (0|1|2);
                return { ...h, states: newStates };
            }));
        },
        setCurrentMonth, setTheme, setBirthDate, setTaskSystemVersion, setV6Mode,
        handleV2ResetScan, handleV3SelectTask, handleV3ClearSelection, handleV4DismissPage, handleV4RestoreDismissed,
        handleV5StartNewDay, handleV6StartNewDay, handleV7NewCycle, handleV7DismissOldTasks, handleV7MarkUnfinished, handleV7MarkRecurring,
        handleAddContext, handleCycleContextState, setContextLogic, handleToggleNoNextActionFilter,
        handleSaveView, handleApplyView, handleDeleteView,
        handleAddKanbanColumn, handleUpdateKanbanColumn, handleDeleteKanbanColumn, handleMoveTaskInKanban,
        allocateStatPoint, claimQuestReward, acceptPenaltyQuest,
        handleStartDistillation, handleDistillationCompletion, handleStabilizeConcoction, handlePerformTransmutation, handleAwakenHomunculus, handleResearchFormula,
        handleImportMloTasks,
        // Raw setters passed for simplicity where no logic is needed
        setV5ScanIndex, setV7LineTaskId,
    }), [
        handleAddTask, handleToggleComplete, handleDeleteTask, handleUndoTask, handleStarTask, handleRepeatTask,
        handleUpdateTaskText, handleUpdateTaskNote, handleAddSubtask, handleAddTag, handleRemoveTag,
        setCurrentParentTask, handleToggleCollapse, handleTogglePriorityDetails, handleUpdatePriorityDetail,
        handleBrainstormTimerToggle, handleArchiveCompletedTasks, handleDeleteAllTasks, handleRestoreTask, handleDrop,
        setActiveTagFilter, setSearchQuery, setCurrentPage, setActiveTaskId,
        setCurrentMonth, setTheme, setBirthDate, setTaskSystemVersion, setV6Mode,
        handleV2ResetScan, handleV3SelectTask, handleV3ClearSelection, handleV4DismissPage, handleV4RestoreDismissed,
        handleV5StartNewDay, handleV6StartNewDay, handleV7NewCycle, handleV7DismissOldTasks, handleV7MarkUnfinished, handleV7MarkRecurring,
        handleAddContext, handleCycleContextState, setContextLogic, handleToggleNoNextActionFilter,
        handleSaveView, handleApplyView, handleDeleteView,
        handleAddKanbanColumn, handleUpdateKanbanColumn, handleDeleteKanbanColumn, handleMoveTaskInKanban,
        allocateStatPoint, claimQuestReward, acceptPenaltyQuest,
        handleStartDistillation, handleDistillationCompletion, handleStabilizeConcoction, handlePerformTransmutation, handleAwakenHomunculus, handleResearchFormula,
        handleImportMloTasks,
    ]);

    // === DERIVED STATE ===
    const derivedState = useMemo(() => {
        const allTags = Array.from(new Set(tasks.flatMap(t => t.tags.split(' ')).filter(Boolean)));
        
        const projectTasks = tasks.filter(t => t.text.match(/\[P:.*\]/));
        const projectMetrics: Metrics = {
            total: projectTasks.length,
            incomplete: projectTasks.filter(t => !t.completed).length,
            withoutNextAction: projectTasks.filter(p => {
                if (p.completed) return false;
                const projectTagMatch = p.text.match(/\[P:.*\]/);
                if (!projectTagMatch) return false;
                const tagStartIndex = p.text.indexOf(projectTagMatch[0]);
                const textBeforeTag = p.text.substring(0, tagStartIndex);
                return textBeforeTag.trim() === '';
            }).length,
            oldTasks: 0,
            newTasks: 0
        };

        const normalTasks = tasks.filter(t => !t.text.match(/\[P:.*\]/));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const taskMetrics: Metrics = {
            total: normalTasks.length,
            incomplete: normalTasks.filter(t => !t.completed).length,
            oldTasks: normalTasks.filter(t => !t.completed && new Date(t.createdAt) < sevenDaysAgo).length,
            newTasks: normalTasks.filter(t => !t.completed && new Date(t.createdAt) >= sevenDaysAgo).length,
            withoutNextAction: 0
        };

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyCompletedProjects = projectTasks.filter(p => p.completed && p.completedAt && new Date(p.completedAt) >= oneWeekAgo).length;
        const totalActiveProjectsThisWeek = projectTasks.filter(p => new Date(p.createdAt) >= oneWeekAgo || (p.completed && p.completedAt && new Date(p.completedAt) >= oneWeekAgo)).length;
        
        const breadcrumbs: Task[] = [];
        let current = currentParentTask;
        while(current) {
            breadcrumbs.unshift(current);
            current = tasks.find(t => t.id === current!.parentId) || null;
        }

        const completedTaskCount = tasks.filter(t => t.completed).length;
        const archivedTasksToDisplay = [...archivedTasks].sort((a,b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
        
        return {
            allTags, projectMetrics, taskMetrics, weeklyCompletedProjects, totalActiveProjectsThisWeek,
            breadcrumbs, completedTaskCount, archivedTasksToDisplay
        };
    }, [tasks, currentParentTask, archivedTasks]);

    return {
        state: {
            tasks, habits, archivedTasks, deletedTasks, theme, isLoading,
            birthDate, currentPage, activeTaskId, currentMonth,
            currentParentTask, activeTagFilter, searchQuery,
            contexts, activeContextIds, excludedContextIds, contextLogic,
            isFilteringByNoNextAction, savedViews, activeViewId,
            kanbanBoard,
            taskSystemVersion, v2LineTaskId, v3ActiveTaskIds, v5ScanIndex, v6Mode, v6LineTaskId,
            v7LineTaskId,
            playerState, quests, inPenaltyZone,
            alchemyState, distillationGameEvent
        },
        handlers,
        derivedState,
    };
};
