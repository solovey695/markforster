import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Habit } from '../types';
import HabitStatsModal from './HabitStatsModal';
import { useMediaQuery } from '../hooks/useMediaQuery';

type AppData = ReturnType<typeof useAppData>;

const isColorLight = (hexColor: string): boolean => {
    try {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128;
    } catch (e) {
        return false;
    }
};

const HabitView: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { state, handlers } = appData;
    const { habits, currentMonth } = state;
    const today = useMemo(() => new Date(), []);
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitColor, setNewHabitColor] = useState('#ff0000');
    
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [editingHabitName, setEditingHabitName] = useState('');
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    
    const getCalendarGridInfo = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 for Monday
        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getCalendarGridInfo(currentMonth);
    const monthKey = `${year}-${month}`;


    const handleLocalAddHabit = () => {
        const habitNames = newHabitName.split('\n').map(name => name.trim()).filter(Boolean);
        if (habitNames.length === 0) return;
        
        habitNames.forEach(name => {
            handlers.handleAddHabit(name, newHabitColor);
        });

        setNewHabitName('');
    };

    const handleStartEdit = (habit: Habit) => {
        setEditingHabitId(habit.id);
        setEditingHabitName(habit.name);
    };

    const handleConfirmEdit = () => {
        if (editingHabitId && editingHabitName.trim()) {
            handlers.handleUpdateHabit(editingHabitId, editingHabitName.trim());
        }
        setEditingHabitId(null);
        setEditingHabitName('');
    };
    
    const habitStats = useMemo(() => {
        if (habits.length === 0) return null;
        let bestHabit = { name: '', percentage: 0 };
        let worstHabit = { name: '', percentage: 100 };
        let totalCompletions = 0;
        let totalPossibleDays = 0;

        habits.forEach(h => {
            const monthStates = h.states[monthKey] || [];
            const completions = monthStates.filter(s => s === 1).length;
            const percentage = (completions / daysInMonth) * 100;
            totalCompletions += completions;
            totalPossibleDays += daysInMonth;
            if (percentage > bestHabit.percentage) bestHabit = { name: h.name, percentage };
            if (percentage < worstHabit.percentage) worstHabit = { name: h.name, percentage };
        });

        const averagePercentage = totalPossibleDays > 0 ? (totalCompletions / totalPossibleDays) * 100 : 0;
        return { bestHabit, worstHabit, averagePercentage, totalCompletions };
    }, [habits, currentMonth, daysInMonth, monthKey]);

    return (
        <div className="h-full pr-2">
             <div className="mb-6 space-y-2">
                <textarea 
                    value={newHabitName} 
                    onChange={e => setNewHabitName(e.target.value)} 
                    placeholder="Новые привычки (каждая с новой строки)" 
                    className="w-full bg-[var(--glass-bg)] p-2 rounded"
                    rows={3}
                />
                <div className="flex items-center gap-4">
                     <input 
                        type="color" 
                        value={newHabitColor} 
                        onChange={e => setNewHabitColor(e.target.value)} 
                        className="w-10 h-10 p-0 bg-transparent border-none rounded-lg cursor-pointer"
                        title="Выбрать цвет для новых привычек"
                    />
                    <button onClick={handleLocalAddHabit} className="flex-grow bg-[var(--accent-neon)] p-2 rounded text-black font-semibold">
                        Добавить привычки
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <button onClick={() => handlers.setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt;</button>
                <h3 className="text-lg font-semibold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => handlers.setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>&gt;</button>
            </div>
            
            <div className="space-y-6">
                 {habits.map(habit => (
                    <div key={habit.id} className="p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)]">
                        {/* Common Header for both mobile and desktop */}
                        <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2 flex-grow min-w-0">
                                <input
                                    type="color"
                                    value={habit.color}
                                    onChange={(e) => handlers.handleUpdateHabit(habit.id, undefined, e.target.value)}
                                    className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent flex-shrink-0"
                                />
                                {editingHabitId === habit.id ? (
                                    <input
                                        type="text"
                                        value={editingHabitName}
                                        onChange={(e) => setEditingHabitName(e.target.value)}
                                        onBlur={handleConfirmEdit}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmEdit();
                                            if (e.key === 'Escape') setEditingHabitId(null);
                                        }}
                                        className="bg-[var(--glass-bg)] p-1 rounded outline-none ring-1 ring-[var(--accent-neon)] text-[var(--text-color)] w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <button
                                        style={{ color: habit.color }}
                                        className="font-medium text-left hover:brightness-125 transition-all truncate"
                                        onClick={() => setSelectedHabit(habit)}
                                        onDoubleClick={() => handleStartEdit(habit)}
                                        title="Клик для статистики, двойной клик для редактирования"
                                    >
                                        {habit.name}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handlers.handleDeleteHabit(habit.id)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--undone)]">🗑️</button>
                            </div>
                        </div>

                        {/* Conditional Rendering for days */}
                        {isDesktop ? (
                            // Desktop: Horizontal List of days
                            <div className="flex flex-wrap gap-1.5">
                                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                    const dayState = habit.states[monthKey]?.[dayIndex] || 0;
                                    const isToday = today.getFullYear() === currentMonth.getFullYear() && today.getMonth() === currentMonth.getMonth() && today.getDate() === dayIndex + 1;
                                    const isFilled = dayState === 1;
                                    const dayTextColor = isFilled ? (isColorLight(habit.color) ? 'text-black/70' : 'text-white/70') : 'text-[var(--text-secondary)]';

                                    return (
                                        <button 
                                            key={dayIndex}
                                            onClick={() => handlers.handleHabitClick(habit.id, dayIndex, monthKey, daysInMonth)}
                                            className={`w-6 h-6 border rounded cursor-pointer transition-all relative flex items-center justify-center text-xs ${dayState === 1 ? '' : dayState === 2 ? 'border-2' : 'opacity-30'} ${isToday ? 'outline outline-2 outline-offset-1 outline-[var(--accent-neon)]' : ''}`}
                                            style={{ backgroundColor: dayState === 1 ? habit.color : 'transparent', borderColor: habit.color }}
                                            aria-label={`Отметить привычку на ${dayIndex + 1} число`}
                                        >
                                            <span className={`pointer-events-none ${dayTextColor}`}>{dayIndex + 1}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            // Mobile: Calendar Grid
                            <div>
                                <div className="grid grid-cols-7 gap-1 place-items-center text-xs text-[var(--text-secondary)] mb-2">
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day}>{day}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                                    {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                        const dayState = habit.states[monthKey]?.[dayIndex] || 0;
                                        const isToday = today.getFullYear() === currentMonth.getFullYear() && today.getMonth() === currentMonth.getMonth() && today.getDate() === dayIndex + 1;
                                        const isFilled = dayState === 1;
                                        const dayTextColor = isFilled ? (isColorLight(habit.color) ? 'text-black/70' : 'text-white/70') : 'text-[var(--text-secondary)]';

                                        return (
                                            <button
                                                key={dayIndex}
                                                onClick={() => handlers.handleHabitClick(habit.id, dayIndex, monthKey, daysInMonth)}
                                                className={`aspect-square w-full border rounded cursor-pointer transition-all relative flex items-center justify-center text-sm ${dayState === 1 ? '' : dayState === 2 ? 'border-2' : 'opacity-30'} ${isToday ? 'outline outline-2 outline-offset-1 outline-[var(--accent-neon)]' : ''}`}
                                                style={{ backgroundColor: dayState === 1 ? habit.color : 'transparent', borderColor: habit.color }}
                                                aria-label={`Отметить привычку на ${dayIndex + 1} число`}
                                            >
                                                <span className={`pointer-events-none ${dayTextColor}`}>{dayIndex + 1}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {habitStats && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                    <div className="p-2 bg-[var(--glass-bg)] rounded">
                        <h4 className="font-bold">Лучшая привычка</h4>
                        <p>{habitStats.bestHabit.name} ({Math.round(habitStats.bestHabit.percentage)}%)</p>
                    </div>
                    <div className="p-2 bg-[var(--glass-bg)] rounded">
                        <h4 className="font-bold">Худшая привычка</h4>
                        <p>{habitStats.worstHabit.name} ({Math.round(habitStats.worstHabit.percentage)}%)</p>
                    </div>
                    <div className="p-2 bg-[var(--glass-bg)] rounded">
                        <h4 className="font-bold">В среднем</h4>
                        <p>{Math.round(habitStats.averagePercentage)}%</p>
                    </div>
                </div>
            )}
            <HabitStatsModal habit={selectedHabit} onClose={() => setSelectedHabit(null)} />
        </div>
    );
};

export default HabitView;