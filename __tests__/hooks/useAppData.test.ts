import { renderHook, act } from '@testing-library/react';
import { useAppData } from '../../hooks/useAppData';
import * as utils from '../../utils';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
// FIX: Module '"../../constants"' has no exported member 'INITIAL_NEURAL_ARCHITECT_STATE'.
import { INITIAL_PLAYER_STATE, INITIAL_ALCHEMY_STATE } from '../../constants';

// Mock the createId utility to return predictable IDs
jest.mock('../../utils', () => ({
  createId: jest.fn(() => `mock-id-${Math.random()}`),
  getDateString: jest.fn((date: Date) => date.toISOString().split('T')[0]),
}));

describe('useAppData hook', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset mocks before each test
    (utils.createId as jest.Mock).mockClear();
    (utils.getDateString as jest.Mock).mockClear();
  });

  it('should handle adding a single task', () => {
    // FIX: Removed arguments from useAppData hook call.
    const { result } = renderHook(() => useAppData());
    
    act(() => {
      result.current.handlers.handleAddTask('Новая задача');
    });

    expect(result.current.state.tasks).toHaveLength(1);
    expect(result.current.state.tasks[0].text).toBe('Новая задача');
  });

  it('should handle adding multiple tasks separated by newlines', () => {
    // FIX: Removed arguments from useAppData hook call.
    const { result } = renderHook(() => useAppData());

    act(() => {
      result.current.handlers.handleAddTask('Задача 1\nЗадача 2');
    });

    expect(result.current.state.tasks).toHaveLength(2);
    expect(result.current.state.tasks[0].text).toBe('Задача 1');
    expect(result.current.state.tasks[1].text).toBe('Задача 2');
  });
  
  it('should handle adding a project task', () => {
    // FIX: Removed arguments from useAppData hook call.
    const { result } = renderHook(() => useAppData());

    act(() => {
      result.current.handlers.handleAddTask('[P: Новый проект] разобраться с тестами');
    });

    expect(result.current.state.tasks).toHaveLength(1);
    expect(result.current.state.tasks[0].text).toContain('[P: Новый проект]');
    expect(result.current.state.tasks[0].parentId).toBeNull();
  });

  it('should delete all data when handleDeleteAllTasks is called', () => {
    // FIX: Removed arguments from useAppData hook call.
    const { result } = renderHook(() => useAppData());

    // Add some initial data
    act(() => {
      result.current.handlers.handleAddTask('Задача для удаления');
      result.current.handlers.handleAddContext('Работа', ['#work']);
      result.current.handlers.handleSaveView('Рабочие задачи', '📄');
      result.current.handlers.setV5ScanIndex(5);
      result.current.handlers.setV7LineTaskId('some-id');
    });

    // Verify data exists
    expect(result.current.state.tasks.length).toBe(1);
    expect(result.current.state.contexts.length).toBe(1);
    expect(result.current.state.savedViews.length).toBe(1);
    expect(result.current.state.v5ScanIndex).toBe(5);
    expect(result.current.state.v7LineTaskId).toBe('some-id');


    // Trigger the delete all action
    act(() => {
      result.current.handlers.handleDeleteAllTasks();
    });

    // Assert that all relevant state is cleared
    expect(result.current.state.tasks).toEqual([]);
    expect(result.current.state.archivedTasks).toEqual([]);
    expect(result.current.state.deletedTasks).toEqual([]);
    expect(result.current.state.contexts).toEqual([]);
    expect(result.current.state.savedViews).toEqual([]);
    expect(result.current.state.playerState).toEqual(INITIAL_PLAYER_STATE);
    expect(result.current.state.quests).toEqual([]);
    // FIX: Updated test to check for the correct state property and initial value after refactoring.
    expect(result.current.state.alchemyState).toEqual(INITIAL_ALCHEMY_STATE);
    expect(result.current.state.searchQuery).toBe('');
    expect(result.current.state.v3ActiveTaskIds).toEqual([]);
    expect(result.current.state.v5ScanIndex).toBeNull();
    expect(result.current.state.v6Mode).toBe('reverse');
    expect(result.current.state.v7LineTaskId).toBeNull();
  });

  describe('Kanban Logic', () => {
    it('should add a new task to the first kanban column by default', () => {
        // FIX: Removed arguments from useAppData hook call.
        const { result } = renderHook(() => useAppData());
        const firstColumnId = result.current.state.kanbanBoard.columns[0].id;

        act(() => {
            result.current.handlers.handleAddTask('Kanban Task 1');
        });

        const task = result.current.state.tasks[0];
        expect(task.kanbanColumnId).toBe(firstColumnId);
        expect(task.kanbanOrder).toBe(0);
    });

    it('should add a new task to a specified kanban column', () => {
        // FIX: Removed arguments from useAppData hook call.
        const { result } = renderHook(() => useAppData());
        const secondColumnId = result.current.state.kanbanBoard.columns[1].id;

        act(() => {
            result.current.handlers.handleAddTask('Specific Column Task', secondColumnId);
        });

        const task = result.current.state.tasks[0];
        expect(task.kanbanColumnId).toBe(secondColumnId);
        expect(task.kanbanOrder).toBe(0);
    });

    it('should move a task between columns and re-order correctly', () => {
        // FIX: Removed arguments from useAppData hook call.
        const { result } = renderHook(() => useAppData());
        const col1 = result.current.state.kanbanBoard.columns[0].id;
        const col2 = result.current.state.kanbanBoard.columns[1].id;

        act(() => {
            result.current.handlers.handleAddTask('Task A', col1);
            result.current.handlers.handleAddTask('Task B', col1);
            result.current.handlers.handleAddTask('Task C', col2);
        });
        
        const taskA_id = result.current.state.tasks.find(t => t.text === 'Task A')!.id;
        const taskB_id = result.current.state.tasks.find(t => t.text === 'Task B')!.id;

        // Move Task A from col1 (index 0) to col2 (index 0)
        act(() => {
            result.current.handlers.handleMoveTaskInKanban(taskA_id, col1, col2, 0);
        });

        const movedTask = result.current.state.tasks.find(t => t.id === taskA_id);
        expect(movedTask?.kanbanColumnId).toBe(col2);
        expect(movedTask?.kanbanOrder).toBe(0);

        const shiftedTaskC = result.current.state.tasks.find(t => t.text === 'Task C');
        expect(shiftedTaskC?.kanbanOrder).toBe(1);

        const remainingTaskB = result.current.state.tasks.find(t => t.id === taskB_id);
        expect(remainingTaskB?.kanbanColumnId).toBe(col1);
        expect(remainingTaskB?.kanbanOrder).toBe(0);
    });
    
    it('should move tasks from a deleted column to the backlog', () => {
        // FIX: Removed arguments from useAppData hook call.
        const { result } = renderHook(() => useAppData());
        const col1 = result.current.state.kanbanBoard.columns[0].id;
        const col2 = result.current.state.kanbanBoard.columns[1].id;
        const col3 = result.current.state.kanbanBoard.columns[2].id;

        act(() => {
            result.current.handlers.handleAddTask('Task 1', col2);
            result.current.handlers.handleAddTask('Task 2', col2);
        });
        
        const task1 = result.current.state.tasks.find(t => t.text === 'Task 1')!;
        expect(task1.kanbanColumnId).toBe(col2);

        // Delete column 2
        act(() => {
            result.current.handlers.handleDeleteKanbanColumn(col2);
        });
        
        // Assert column is deleted
        expect(result.current.state.kanbanBoard.columns.find(c => c.id === col2)).toBeUndefined();
        expect(result.current.state.kanbanBoard.columns.length).toBe(2);

        // Assert tasks are moved to the first column (col1)
        const movedTask1 = result.current.state.tasks.find(t => t.text === 'Task 1')!;
        const movedTask2 = result.current.state.tasks.find(t => t.text === 'Task 2')!;
        expect(movedTask1.kanbanColumnId).toBe(col1);
        expect(movedTask2.kanbanColumnId).toBe(col1);
        expect(movedTask1.kanbanOrder).toBeGreaterThan(-1);
        expect(movedTask2.kanbanOrder).toBeGreaterThan(-1);
    });
  });
});