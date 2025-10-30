// FIX: Removed self-import of ProbeGameEvent.
export type Tab = 'tasks' | 'projects' | 'habits' | 'archive' | 'kanban' | 'system' | 'laboratory';

export type TaskSystemVersion = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface PriorityDetails {
  why: string;
  vision: string;
  brainstorm: string;
  organization: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  undone: boolean;
  completedAt?: string;
}

export interface Task {
  id:string;
  text: string;
  tags: string;
  starCount: number;
  completed: boolean;
  undone: boolean;
  repeated: boolean;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  originalIndex: number;
  subtasks: Subtask[];
  parentId: string | null;
  note: string;
  isCollapsed: boolean;
  priorityDetails: PriorityDetails;
  priorityDetailsOpen: boolean;
  brainstormTimerRunning: boolean;
  brainstormTimerPaused: boolean;
  brainstormTimeLeft: number;
  rewarded?: boolean;
  v7list?: 'main' | 'recurring' | 'unfinished';
  pageDate?: string;
  starredAt?: string;
  kanbanColumnId?: string;
  kanbanOrder?: number;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  states: {
    [monthKey: string]: (0 | 1 | 2)[]; // 0: unfilled, 1: filled, 2: outlined
  };
}

export interface PlayerStats {
    strength: number;     // Сила: Влияет на скорость выполнения "тяжелых" проектов
    agility: number;      // Ловкость: Шанс получить бонусный XP за быструю задачу
    vitality: number;     // Живучесть: Уменьшает негативные эффекты от провала квестов
    intelligence: number; // Интеллект: Увеличивает получаемый XP
    sense: number;        // Восприятие: Повышает шанс появления "скрытых" квестов
}

export type QuestType = 'daily' | 'main' | 'urgent' | 'penalty';

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    isComplete: boolean;
    xpReward: number;
    progress: number;
    progressGoal: number;
    claimed: boolean;
    date: string; // YYYY-MM-DD
}

export interface PlayerState {
    name: string;
    title: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    stats: PlayerStats;
    unallocatedStatPoints: number;
}

export interface Metrics {
    total: number;
    incomplete: number;
    withoutNextAction: number;
    oldTasks: number;
    newTasks: number;
}

export interface Context {
  id: string;
  name: string;
  tags: string[];
}

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  searchQuery: string;
  activeTagFilter: string | null;
  activeContextIds: string[];
  excludedContextIds: string[];
  contextLogic: 'OR' | 'AND';
}

export interface KanbanColumn {
  id: string;
  title: string;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

// Gamification: Alchemy
export interface DistillationGameEvent {
    taskId: string;
    targetValue: number;
    initialVariance: number;
}

export interface Quintessence {
    id: string;
    collectedAt: string;
    value: number;
    source: string;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
}

export interface HomunculusState {
    name: string;
    level: number;
    abilities: string[];
    isActive: boolean;
    activationTime?: number; // timestamp
    duration: number; // in milliseconds
    volatility: number; // 0 to 100
}

export interface AlchemyState {
    quintessence: Quintessence[];
    homunculus: HomunculusState | null;
    researchedFormulae: string[];
    transmutationCharge: number;
    lastTransmutationTimestamp: number;
}