import React, { useMemo } from 'react';
import { Habit } from '../types';
import { getDateString } from '../utils';

interface HabitStatsModalProps {
    habit: Habit | null;
    onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
    <div className="bg-[var(--glass-bg)] p-4 rounded-lg text-center border border-[var(--glass-border)]">
        <div className="text-3xl mb-1">{icon}</div>
        <div className="text-2xl font-bold text-[var(--text-color)]">{value}</div>
        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{label}</div>
    </div>
);

const HabitStatsModal: React.FC<HabitStatsModalProps> = ({ habit, onClose }) => {
    const stats = useMemo(() => {
        if (!habit) return {
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
            monthlyCompletions: 0,
        };

        const dateMap = new Map<string, 0 | 1 | 2>();
        const sortedMonthKeys = Object.keys(habit.states).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            return new Date(yearA, monthA).getTime() - new Date(yearB, monthB).getTime();
        });

        if (sortedMonthKeys.length === 0) {
            return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, monthlyCompletions: 0 };
        }
        
        sortedMonthKeys.forEach(monthKey => {
            const [year, month] = monthKey.split('-').map(Number);
            habit.states[monthKey].forEach((state, dayIndex) => {
                const date = new Date(year, month, dayIndex + 1);
                dateMap.set(getDateString(date), state);
            });
        });

        // Longest Streak
        let longestStreak = 0;
        let currentStreakInternal = 0;
        // FIX: Correctly parse date components as numbers before passing them to the `Date` constructor. The `Date` constructor expects numbers for year and month, but was receiving strings, causing a type error.
        const [firstDateYear, firstDateMonth] = sortedMonthKeys[0].split('-').map(Number);
        const firstDate = new Date(firstDateYear, firstDateMonth, 1);
        const lastDate = new Date();
        for (let d = firstDate; d <= lastDate; d.setDate(d.getDate() + 1)) {
            const state = dateMap.get(getDateString(d)) || 0;
            if (state === 1) {
                currentStreakInternal++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreakInternal);
                currentStreakInternal = 0;
            }
        }
        longestStreak = Math.max(longestStreak, currentStreakInternal);

        // Current Streak
        let currentStreak = 0;
        const today = new Date();
        let checkDate = new Date();
        if ((dateMap.get(getDateString(today)) || 0) !== 1) {
             checkDate.setDate(checkDate.getDate() - 1);
        }

        while (dateMap.get(getDateString(checkDate)) === 1) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Total & Monthly Completions
        let totalCompletions = 0;
        let monthlyCompletions = 0;
        const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
        
        for (const [dateStr, state] of dateMap.entries()) {
            if (state === 1) {
                totalCompletions++;
                const date = new Date(dateStr);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                if (monthKey === currentMonthKey) {
                    monthlyCompletions++;
                }
            }
        }

        return { currentStreak, longestStreak, totalCompletions, monthlyCompletions };
    }, [habit]);

    const renderCalendar = () => {
        if (!habit) return null;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 for Monday

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = getDateString(date);
            const monthKey = `${year}-${month}`;
            const state = habit.states[monthKey]?.[i - 1] || 0;
            
            let bgColor = 'bg-transparent';
            if (state === 1) bgColor = `bg-[${habit.color}]`;
            
            let borderColor = `border-[${habit.color}]/50`;
            if (state === 2) borderColor = `border-[${habit.color}]`;

            const isToday = getDateString(new Date()) === dateString;

            days.push(
                <div 
                    key={i} 
                    className={`w-8 h-8 rounded border transition-all flex items-center justify-center ${borderColor} ${state === 0 ? 'opacity-30' : ''} ${state === 2 ? 'border-2' : ''} ${isToday ? 'outline outline-2 outline-offset-1 outline-[var(--accent-neon)]' : ''}`}
                    style={{ backgroundColor: state === 1 ? habit.color : 'transparent' }}
                    title={date.toLocaleDateString()}
                >
                    <span className="text-xs">{i}</span>
                </div>
            );
        }

        return (
            <div>
                 <h3 className="text-lg font-semibold mb-2">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                 <div className="grid grid-cols-7 gap-1.5 place-items-center text-xs text-[var(--text-secondary)] mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day}>{day}</div>)}
                 </div>
                 <div className="grid grid-cols-7 gap-1.5">
                    {days}
                 </div>
            </div>
        );
    };

    const isVisible = habit !== null;

    return (
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-container)] p-6 rounded-lg shadow-lg w-full max-w-2xl border border-[var(--glass-border)]" 
                onClick={e => e.stopPropagation()}
            >
                {habit && (
                    <>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-4 h-4 rounded-full" style={{backgroundColor: habit.color}}></span>
                                    {habit.name}
                                </h2>
                                <p className="text-[var(--text-secondary)]">Статистика привычки</p>
                            </div>
                            <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-color)]">&times;</button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <StatCard label="Текущая серия" value={`${stats.currentStreak} д.`} icon="🔥" />
                            <StatCard label="Лучшая серия" value={`${stats.longestStreak} д.`} icon="🏆" />
                            <StatCard label="Выполнено в этом месяце" value={stats.monthlyCompletions} icon="🗓️" />
                            <StatCard label="Всего выполнено" value={stats.totalCompletions} icon="✅" />
                        </div>
                        
                        <div>
                            {renderCalendar()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HabitStatsModal;