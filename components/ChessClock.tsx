import React, { useState, useEffect, useRef } from 'react';
import { useAppData } from '../hooks/useAppData';

type AppData = ReturnType<typeof useAppData>;

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ChessClock: React.FC<{ appData: AppData }> = ({ appData }) => {
    const [initialMinutes, setInitialMinutes] = useState(60);
    const initialTime = initialMinutes * 60;

    const [player1Time, setPlayer1Time] = useState(initialTime);
    const [player2Time, setPlayer2Time] = useState(initialTime);
    const [activePlayer, setActivePlayer] = useState<'player1' | 'player2' | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [minutesInput, setMinutesInput] = useState(String(initialMinutes));

    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const helpRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedMinutes = localStorage.getItem('chessClockMinutes');
        if (savedMinutes && !isNaN(parseInt(savedMinutes, 10))) {
            const saved = parseInt(savedMinutes, 10);
            setInitialMinutes(saved);
            setMinutesInput(String(saved));
        }
    }, []);
    
    useEffect(() => {
        setPlayer1Time(initialTime);
        setPlayer2Time(initialTime);
    }, [initialTime]);


    useEffect(() => {
        // If no player is active, we don't need an interval.
        if (!activePlayer) {
            return;
        }

        // Set up the interval when a player becomes active.
        intervalRef.current = setInterval(() => {
            if (activePlayer === 'player1') {
                setPlayer1Time(prev => (prev > 0 ? prev - 1 : 0));
            } else if (activePlayer === 'player2') {
                setPlayer2Time(prev => (prev > 0 ? prev - 1 : 0));
            }
        }, 1000);

        // The cleanup function is called when `activePlayer` changes or the component unmounts.
        // This is where we clear the interval to prevent memory leaks.
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [activePlayer]);
    
    useEffect(() => {
        if (player1Time === 0 || player2Time === 0) {
             if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
             }
             setActivePlayer(null);
        }
    }, [player1Time, player2Time]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setIsHelpVisible(false);
            }
        };

        if (isHelpVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isHelpVisible]);

    const handleSwitch = () => {
        if (player1Time === 0 || player2Time === 0) return;
        if (activePlayer === null) {
             setActivePlayer('player1');
             return;
        }
        setActivePlayer(prev => (prev === 'player1' ? 'player2' : 'player1'));
    };
    
    const handleReset = () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
         setActivePlayer(null);
         setPlayer1Time(initialTime);
         setPlayer2Time(initialTime);
    }
    
    const handleSettingsSave = () => {
        const newMinutes = parseInt(minutesInput, 10);
        if (!isNaN(newMinutes) && newMinutes > 0) {
            setInitialMinutes(newMinutes);
            localStorage.setItem('chessClockMinutes', String(newMinutes));
            setIsSettingsOpen(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setActivePlayer(null);
            setPlayer1Time(newMinutes * 60);
            setPlayer2Time(newMinutes * 60);
        }
    };


    const player1Classes = `p-4 rounded-lg text-center transition-colors duration-300 ${activePlayer === 'player1' ? 'bg-[var(--accent-neon)] text-black' : 'bg-[var(--glass-bg)]'}`;
    const player2Classes = `p-4 rounded-lg text-center transition-colors duration-300 ${activePlayer === 'player2' ? 'bg-[var(--accent-neon)] text-black' : 'bg-[var(--glass-bg)]'}`;
    const timeFontSizeClass = initialMinutes >= 100 ? 'text-3xl' : 'text-4xl';

    return (
        <div className="p-0">
             <div className="flex justify-between items-center px-2 mb-2">
                <h2 className="text-xs font-semibold uppercase text-[var(--text-secondary)] tracking-wider">Шахматные часы</h2>
                <div className="flex items-center gap-2">
                    <div ref={helpRef} className="relative">
                        <button onClick={() => setIsHelpVisible(p => !p)} className="text-lg p-1 -m-1" title="Справка">?</button>
                         {isHelpVisible && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-[var(--bg-main)] p-4 rounded-lg shadow-lg border border-[var(--glass-border)] z-20 text-sm text-left text-[var(--text-color)] font-sans normal-case">
                                <button onClick={() => setIsHelpVisible(false)} className="absolute top-1 right-1 text-xl leading-none p-1 text-[var(--text-secondary)] hover:text-[var(--text-color)]">&times;</button>
                                <h4 className="font-bold mb-2">Как использовать</h4>
                                <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)]">
                                    <li>Нажмите на любой таймер, чтобы начать отсчет времени для основной задачи.</li>
                                    <li>Если вас отвлекли, нажмите на второй таймер. Он начнет считать время отвлечения, а первый остановится.</li>
                                    <li>Чтобы вернуться к основной задаче, снова нажмите на первый таймер.</li>
                                </ol>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-lg p-1 -m-1" title="Настройки">⚙️</button>
                </div>
             </div>
             {isSettingsOpen && (
                <div className="px-2 mb-2 flex items-center gap-2">
                    <input
                        type="number"
                        value={minutesInput}
                        onChange={(e) => setMinutesInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSettingsSave()}
                        className="w-full bg-black/20 p-1 rounded text-sm outline-none ring-1 ring-transparent focus:ring-[var(--accent-neon)]"
                        placeholder="Минуты"
                    />
                    <button onClick={handleSettingsSave} className="px-3 py-1 text-xs bg-[var(--accent-soft)]/50 rounded hover:bg-[var(--accent-soft)]/80">
                        OK
                    </button>
                </div>
             )}
            <div onClick={handleSwitch} className={`cursor-pointer grid grid-cols-2 gap-2 font-mono ${timeFontSizeClass}`}>
                <div className={player1Classes}>
                    {formatTime(player1Time)}
                </div>
                <div className={player2Classes}>
                    {formatTime(player2Time)}
                </div>
            </div>
            <button onClick={handleReset} className="w-full mt-2 text-xs p-1 bg-[var(--glass-bg)] rounded hover:bg-white/10">
                Сброс
            </button>
        </div>
    );
};

export default ChessClock;
