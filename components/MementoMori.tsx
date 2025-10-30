import React, { useState, useEffect } from 'react';

interface MementoMoriProps {
    birthDate: string | null;
    onBirthDateChange: (date: string) => void;
}

interface TimeLeft {
    years?: string;
    months?: string;
    weeks?: string;
    days?: string;
    hours?: string;
    minutes?: string;
    isTimeUp: boolean;
}

interface Progress {
    week: number;
    month: number;
    year: number;
}

const ProgressBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="text-left">
        <div className="flex justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>{label}</span>
            <span>{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-[var(--glass-bg)] rounded-full h-1.5 mt-1">
            <div className="bg-[var(--accent-soft)] h-1.5 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const useMementoMori = (birthDate: string | null) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ isTimeUp: false });
    const [progress, setProgress] = useState<Progress>({ week: 0, month: 0, year: 0 });

    useEffect(() => {
        const calculate = () => {
            const now = new Date();

            // Progress Calculations
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            const weekProgress = ((now.getTime() - startOfWeek.getTime()) / (endOfWeek.getTime() - startOfWeek.getTime())) * 100;

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const monthProgress = ((now.getTime() - startOfMonth.getTime()) / (endOfMonth.getTime() - startOfMonth.getTime())) * 100;

            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
            const yearProgress = ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;
            
            setProgress({ week: weekProgress, month: monthProgress, year: yearProgress });

            // Time Left Calculations
            if (!birthDate) {
                setTimeLeft({ isTimeUp: false });
                return;
            }
            try {
                const birth = new Date(birthDate);
                const target = new Date(birth);
                target.setFullYear(birth.getFullYear() + 70);
                const diff = target.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeLeft({ isTimeUp: true });
                    return;
                }
                
                const totalSeconds = diff / 1000;
                const totalMinutes = totalSeconds / 60;
                const totalHours = totalMinutes / 60;
                const totalDays = totalHours / 24;
                const totalWeeks = totalDays / 7;
                const totalMonths = totalDays / (365.25 / 12);
                const totalYears = totalDays / 365.25;

                setTimeLeft({
                    years: Math.floor(totalYears).toLocaleString('ru-RU'),
                    months: Math.floor(totalMonths).toLocaleString('ru-RU'),
                    weeks: Math.floor(totalWeeks).toLocaleString('ru-RU'),
                    days: Math.floor(totalDays).toLocaleString('ru-RU'),
                    hours: Math.floor(totalHours).toLocaleString('ru-RU'),
                    minutes: Math.floor(totalMinutes).toLocaleString('ru-RU'),
                    isTimeUp: false,
                });
            } catch {
                setTimeLeft({ isTimeUp: false });
            }
        };

        calculate();
        const intervalId = setInterval(calculate, 1000); // Update every second
        return () => clearInterval(intervalId);
    }, [birthDate]);

    return { timeLeft, progress };
};

const MementoMori: React.FC<MementoMoriProps> = ({ birthDate, onBirthDateChange }) => {
    const { timeLeft, progress } = useMementoMori(birthDate);

    return (
        <div className="memento-mori-container text-xs text-center py-2 px-2">
            <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Memento Mori</h2>
            <div className="relative group">
                <input 
                    type="date" 
                    value={birthDate || ''} 
                    onChange={e => onBirthDateChange(e.target.value)} 
                    className="bg-transparent border-b border-[var(--glass-border)] text-center text-[var(--text-secondary)] w-full p-1 text-sm appearance-none"
                    aria-label="Дата рождения"
                />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--glass-bg)] px-2 py-1 rounded-md text-[var(--text-color)] text-base shadow-lg">
                    Дата рождения
                </span>
            </div>
            <div className="mt-2 text-base font-semibold text-[var(--text-color)]">
                {timeLeft.isTimeUp ? (
                     <span>✨ 70 лет достигнуто!</span>
                ) : !birthDate ? (
                    <span>...</span>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3 text-left">
                            <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.years}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Лет</span>
                            </div>
                             <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.months}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Месяцев</span>
                            </div>
                             <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.weeks}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Недель</span>
                            </div>
                             <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.days}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Дней</span>
                            </div>
                             <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.hours}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Часов</span>
                            </div>
                             <div className="flex flex-col p-1 rounded-md bg-black/10">
                                <span className="text-lg font-bold">{timeLeft.minutes}</span>
                                <span className="text-xs font-medium text-[var(--text-secondary)]">Минут</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <ProgressBar value={progress.week} label="Неделя" />
                            <ProgressBar value={progress.month} label="Месяц" />
                            <ProgressBar value={progress.year} label="Год" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MementoMori;