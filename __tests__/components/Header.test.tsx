import React from 'react';
import { render } from '@testing-library/react';
import Header from '../../components/Header';
import { describe, jest, it, expect } from '@jest/globals';
import { TaskSystemVersion } from '../../types';

describe('Header component', () => {
  const mockTimer = {
    isActive: false,
    timeLeft: 120,
    toggle: jest.fn(),
  };

  const mockProps = {
    theme: 'cyber-noir',
    onThemeChange: jest.fn(),
    currentTab: 'tasks' as const,
    twoMinTimer: mockTimer,
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    isFocusMode: false,
    onToggleFocusMode: jest.fn(),
    onArchiveTasks: jest.fn(),
    onDeleteAllTasks: jest.fn(),
    isSearchVisible: false,
    onSearchVisibleChange: jest.fn(),
    taskSystemVersion: 1 as TaskSystemVersion,
    onVersionModalOpen: jest.fn(),
    // FIX: Add missing properties to align with HeaderProps type definition
    onToggleSidebar: jest.fn(),
  };

  it('matches the snapshot', () => {
    const { container } = render(<Header {...mockProps} />);
    expect(container).toMatchSnapshot();
  });

  it('matches the snapshot in focus mode', () => {
    const { container } = render(<Header {...mockProps} isFocusMode={true} />);
    expect(container).toMatchSnapshot();
  });
});