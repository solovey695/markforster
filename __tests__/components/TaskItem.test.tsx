// FIX: Reordered imports. The modules that augment Jest's `expect` matchers (`@testing-library/jest-dom` and `jest-axe/extend-expect`) must be imported before Jest's globals (`@jest/globals`) to ensure TypeScript correctly picks up the extended type definitions for the custom matchers.
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
// FIX: Re-added `expect` to this import. The test fails to compile without it, as `expect` is not available as a global in this project's configuration. The type augmentation issue mentioned in a previous comment seems to be resolved.
import { jest, describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import TaskItem from '../../components/TaskItem';
import { Task } from '../../types';

const mockTask: Task = {
  id: 'task-1',
  text: '[P: Test Project] Do something important',
  tags: '#work #urgent',
  starCount: 2,
  completed: false,
  undone: false,
  repeated: false,
  hidden: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  originalIndex: 0,
  subtasks: [],
  parentId: null,
  note: '',
  isCollapsed: true,
  priorityDetails: { why: '', vision: '', brainstorm: '', organization: '' },
  priorityDetailsOpen: false,
  brainstormTimerRunning: false,
  brainstormTimerPaused: false,
  brainstormTimeLeft: 300,
};

const mockHandlers = {
  // FIX: Updated mock function to accept arguments to match its signature. This resolves a TypeScript error where `jest.fn(() => ...)` was inferred as taking 0 arguments, which conflicts with `toHaveBeenCalledWith`.
  handleToggleComplete: jest.fn(),
  handleDeleteTask: jest.fn(),
  handleUndoTask: jest.fn(),
  handleStarTask: jest.fn(),
  handleRepeatTask: jest.fn(),
  handleUpdateTaskText: jest.fn(),
  // FIX: Added missing mock handlers `handleUpdateTaskNote` and `handleAddSubtask` to satisfy the `TaskItemProps` interface and resolve compilation errors.
  handleUpdateTaskNote: jest.fn(),
  handleAddSubtask: jest.fn(),
  handleAddTag: jest.fn(),
  handleRemoveTag: jest.fn(),
  handleEnterTask: jest.fn(),
  handleToggleCollapse: jest.fn(),
  handleTogglePriorityDetails: jest.fn(),
  handleUpdatePriorityDetail: jest.fn(),
  handleBrainstormTimerToggle: jest.fn(),
  onDragStart: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
  setActiveTaskId: jest.fn(),
  onTagClick: jest.fn(),
  onV3SelectTask: jest.fn(),
  handleV7MarkUnfinished: jest.fn(),
  handleV7MarkRecurring: jest.fn(),
  v3ActiveTaskIds: [],
  allTags: [],
  onFocusTask: jest.fn(),
  onStartDistillation: jest.fn(),
};

describe('TaskItem component', () => {
  it('renders task text and project tag correctly', () => {
    render(
      <TaskItem
        item={mockTask}
        index={0}
        tasks={[mockTask]}
        activeTaskId={null}
        currentTab="tasks"
        activeTagFilter={null}
        isDraggable={true}
        taskSystemVersion={1}
        v5ScanIndex={null}
        {...mockHandlers}
      />
    );

    // Check for project tag
    expect(screen.getByText(/\[P: Test Project\]/)).toBeInTheDocument();
    // Check for the rest of the text
    expect(screen.getByText(/Do something important/)).toBeInTheDocument();
    // Check for stars
    expect(screen.getByText('★★')).toBeInTheDocument();
  });

  it('calls handleToggleComplete when the complete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem
        item={mockTask}
        index={0}
        tasks={[mockTask]}
        activeTaskId={null}
        currentTab="tasks"
        activeTagFilter={null}
        isDraggable={true}
        taskSystemVersion={1}
        v5ScanIndex={null}
        {...mockHandlers}
      />
    );

    const completeButton = screen.getByLabelText('Отметить задачу как выполненную');
    await user.click(completeButton);

    expect(mockHandlers.handleToggleComplete).toHaveBeenCalledWith(mockTask.id, false);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TaskItem
        item={mockTask}
        index={0}
        tasks={[mockTask]}
        activeTaskId={null}
        currentTab="tasks"
        activeTagFilter={null}
        isDraggable={true}
        taskSystemVersion={1}
        v5ScanIndex={null}
        {...mockHandlers}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
