import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// FIX: Added 'beforeEach' to the import list from '@jest/globals' to resolve the 'Cannot find name' error.
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import KanbanView from '../../components/KanbanView';
import { useAppData } from '../../hooks/useAppData';
// @google/genai-fix: Removed unused 'ProbedTask' type import to resolve compilation error.
import { KanbanBoard, Task } from '../../types';

// Mock the entire useAppData hook
jest.mock('../../hooks/useAppData');

const mockUseAppData = useAppData as jest.Mock;

const mockTasks: Task[] = [
    { id: 't1', text: 'Task 1 in Backlog', kanbanColumnId: 'col1', kanbanOrder: 0, completed: false, hidden: false, tags: '', originalIndex: 0, parentId: null } as Task,
    { id: 't2', text: 'Task 2 in Progress', kanbanColumnId: 'col2', kanbanOrder: 0, completed: false, hidden: false, tags: '', originalIndex: 1, parentId: null } as Task,
    { id: 't3', text: 'Task 3 in Backlog', kanbanColumnId: 'col1', kanbanOrder: 1, completed: false, hidden: false, tags: '', originalIndex: 2, parentId: null } as Task,
];

const mockBoard: KanbanBoard = {
    columns: [
        { id: 'col1', title: 'Бэклог' },
        { id: 'col2', title: 'В работе' },
    ]
};

const mockHandlers = {
    handleAddTask: jest.fn(),
    handleAddKanbanColumn: jest.fn(),
    // Add other handlers as needed to avoid runtime errors
    setKanbanBoard: jest.fn(),
    handleUpdateKanbanColumn: jest.fn(),
    handleDeleteKanbanColumn: jest.fn(),
    handleMoveTaskInKanban: jest.fn(),
    setActiveTagFilter: jest.fn(),
    handleToggleComplete: jest.fn(),
    handleDeleteTask: jest.fn(),
    handleUndoTask: jest.fn(),
    handleStarTask: jest.fn(),
    handleRepeatTask: jest.fn(),
    handleUpdateTaskText: jest.fn(),
    handleUpdateTaskNote: jest.fn(),
    handleAddSubtask: jest.fn(),
    handleAddTag: jest.fn(),
    handleRemoveTag: jest.fn(),
    setCurrentParentTask: jest.fn(),
    handleToggleCollapse: jest.fn(),
    handleTogglePriorityDetails: jest.fn(),
    handleUpdatePriorityDetail: jest.fn(),
    handleBrainstormTimerToggle: jest.fn(),
    handleV3SelectTask: jest.fn(),
    handleV7MarkUnfinished: jest.fn(),
    handleV7MarkRecurring: jest.fn(),
    
};

const mockDerivedState = {
    allTags: [],
};

const mockState = {
    tasks: mockTasks,
    kanbanBoard: mockBoard,
    fishedTask: null,
    activeTagFilter: null,
    taskSystemVersion: 1,
    v3ActiveTaskIds: [],
    v5ScanIndex: null,
};


describe('KanbanView', () => {
    let onProbeTaskMock: jest.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        onProbeTaskMock = jest.fn();
        mockUseAppData.mockReturnValue({
            state: mockState,
            handlers: mockHandlers,
            derivedState: mockDerivedState,
        });
    });

    it('renders columns and tasks correctly', () => {
        render(<KanbanView appData={mockUseAppData()} onFocusTask={jest.fn()} onProbeTask={onProbeTaskMock} />);
        
        // Check for column titles
        expect(screen.getByText('Бэклог (2)')).toBeInTheDocument();
        expect(screen.getByText('В работе (1)')).toBeInTheDocument();
        
        // Check for tasks in correct columns
        expect(screen.getByText(/Task 1 in Backlog/)).toBeInTheDocument();
        expect(screen.getByText(/Task 3 in Backlog/)).toBeInTheDocument();
        expect(screen.getByText(/Task 2 in Progress/)).toBeInTheDocument();
    });

    it('allows adding a new task to a column', async () => {
        const user = userEvent.setup();
        render(<KanbanView appData={mockUseAppData()} onFocusTask={jest.fn()} onProbeTask={onProbeTaskMock} />);
        
        const textareas = screen.getAllByPlaceholderText('+ Новая карточка');
        const firstColumnTextarea = textareas[0];
        
        await user.type(firstColumnTextarea, 'New Kanban Task{enter}');
        
        expect(mockHandlers.handleAddTask).toHaveBeenCalledWith('New Kanban Task', 'col1');
    });

    it('allows adding a new column', async () => {
        const user = userEvent.setup();
        render(<KanbanView appData={mockUseAppData()} onFocusTask={jest.fn()} onProbeTask={onProbeTaskMock} />);
        
        await user.click(screen.getByText('+ Добавить колонку'));
        
        const input = screen.getByPlaceholderText('Название колонки...');
        await user.type(input, 'New Column{enter}');
        
        expect(mockHandlers.handleAddKanbanColumn).toHaveBeenCalledWith('New Column');
    });
});