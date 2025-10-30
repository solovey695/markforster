import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Sidebar from '../../components/Sidebar';
import { useAppData } from '../../hooks/useAppData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
// FIX: Module '"../../constants"' has no exported member 'INITIAL_NEURAL_ARCHITECT_STATE'.
import { INITIAL_PLAYER_STATE, INITIAL_ALCHEMY_STATE } from '../../constants';

// Mock child components and hooks
jest.mock('../../hooks/useAppData');
jest.mock('../../hooks/useMediaQuery');
jest.mock('../../components/MementoMori', () => () => <div data-testid="memento-mori">MementoMori</div>);
jest.mock('../../components/MetricsPanel', () => () => <div data-testid="metrics-panel">MetricsPanel</div>);
jest.mock('../../components/CircleTracker', () => () => <div data-testid="circle-tracker">CircleTracker</div>);
jest.mock('../../components/PlayerStatus', () => () => <div data-testid="player-status">PlayerStatus</div>);
jest.mock('../../components/ChessClock', () => () => <div data-testid="chess-clock">ChessClock</div>);
jest.mock('../../components/NeuralStatus', () => () => <div data-testid="neural-status">NeuralStatus</div>);


const mockUseAppData = useAppData as jest.Mock;
const mockUseMediaQuery = useMediaQuery as jest.Mock;

describe('Sidebar', () => {
    const onTabChangeMock = jest.fn();
    const onThemeChangeMock = jest.fn();

    const mockAppData = {
        state: {
            playerState: INITIAL_PLAYER_STATE,
            // FIX: Updated mock data to use the refactored `alchemyState` instead of `neuralArchitectState`.
            alchemyState: INITIAL_ALCHEMY_STATE,
            taskSystemVersion: 1,
            savedViews: [],
            activeViewId: null,
        },
        handlers: {
            handleDeleteView: jest.fn(),
            handleApplyView: jest.fn(),
        },
        derivedState: {
            completedTaskCount: 10,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppData.mockReturnValue(mockAppData);
        mockUseMediaQuery.mockReturnValue(false); // Default to desktop
    });

    it('renders all navigation items', () => {
        render(
            <Sidebar
                appData={mockAppData as any}
                currentTab="tasks"
                onTabChange={onTabChangeMock}
                birthDate={null}
                onBirthDateChange={jest.fn()}
                theme="dark"
                onThemeChange={onThemeChangeMock}
                onVersionModalOpen={jest.fn()}
                // FIX: Added missing onStartReview prop to satisfy SidebarProps interface.
                onStartReview={jest.fn()}
                onClose={jest.fn()}
            />
        );

        expect(screen.getByText('Задачи')).toBeInTheDocument();
        expect(screen.getByText('Проекты')).toBeInTheDocument();
        expect(screen.getByText('Канбан')).toBeInTheDocument();
        expect(screen.getByText('Система')).toBeInTheDocument();
        // FIX: Updated the expected navigation item text from 'Мастерская' to 'Лаборатория' to match the component's current implementation.
        expect(screen.getByText('Лаборатория')).toBeInTheDocument();
        expect(screen.getByText('Привычки')).toBeInTheDocument();
        expect(screen.getByText('Архив')).toBeInTheDocument();
    });

    it('calls onTabChange with the correct tab when a nav item is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Sidebar
                appData={mockAppData as any}
                currentTab="tasks"
                onTabChange={onTabChangeMock}
                birthDate={null}
                onBirthDateChange={jest.fn()}
                theme="dark"
                onThemeChange={onThemeChangeMock}
                onVersionModalOpen={jest.fn()}
                // FIX: Added missing onStartReview prop to satisfy SidebarProps interface.
                onStartReview={jest.fn()}
                onClose={jest.fn()}
            />
        );

        const projectsButton = screen.getByText('Проекты');
        await user.click(projectsButton);

        expect(onTabChangeMock).toHaveBeenCalledTimes(1);
        expect(onTabChangeMock).toHaveBeenCalledWith('projects');
    });

    it('highlights the current active tab', () => {
        render(
            <Sidebar
                appData={mockAppData as any}
                currentTab="kanban"
                onTabChange={onTabChangeMock}
                birthDate={null}
                onBirthDateChange={jest.fn()}
                theme="dark"
                onThemeChange={onThemeChangeMock}
                onVersionModalOpen={jest.fn()}
                // FIX: Added missing onStartReview prop to satisfy SidebarProps interface.
                onStartReview={jest.fn()}
                onClose={jest.fn()}
            />
        );
        
        const kanbanButton = screen.getByText('Канбан').closest('button');
        // Check for classes that indicate "active" state
        expect(kanbanButton).toHaveClass('bg-[var(--accent-soft)]/20', 'text-[var(--accent-neon)]');
        
        const tasksButton = screen.getByText('Задачи').closest('button');
        expect(tasksButton).not.toHaveClass('bg-[var(--accent-soft)]/20', 'text-[var(--accent-neon)]');
        expect(tasksButton).toHaveClass('text-[var(--text-secondary)]');
    });

    it('renders desktop theme switcher', () => {
        mockUseMediaQuery.mockReturnValue(false); // Desktop
         render(
            <Sidebar
                appData={mockAppData as any}
                currentTab="tasks"
                onTabChange={onTabChangeMock}
                birthDate={null}
                onBirthDateChange={jest.fn()}
                theme="dark"
                onThemeChange={onThemeChangeMock}
                onVersionModalOpen={jest.fn()}
                // FIX: Added missing onStartReview prop to satisfy SidebarProps interface.
                onStartReview={jest.fn()}
                onClose={jest.fn()}
            />
        );
        const desktopSwitcher = screen.getByLabelText('Тема');
        expect(desktopSwitcher).toBeInTheDocument();
    });
});