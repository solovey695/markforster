import React, { useState, useEffect, useRef } from 'react';
import { DistillationGameEvent } from '../types';

interface DistillationGameProps {
    event: DistillationGameEvent;
    onCompletion: (taskId: string, success: boolean, collectedValue: number) => void;
}

const DistillationGame: React.FC<DistillationGameProps> = ({ event, onCompletion }) => {
    const [position, setPosition] = useState(0);
    const [direction, setDirection] = useState(1);
    const [speed, setSpeed] = useState(2);
    const [gameState, setGameState] = useState<'playing' | 'success' | 'fail' | 'finished'>('playing');
    const [collectedValue, setCollectedValue] = useState(0);

    // FIX: Changed useRef<number>() to useRef<number | null>(null) to provide an initial value and fix the error.
    const animationFrameId = useRef<number | null>(null);

    const targetStart = 50 - event.initialVariance / 2;
    const targetEnd = 50 + event.initialVariance / 2;

    useEffect(() => {
        const animate = () => {
            if (gameState === 'playing') {
                setPosition(prevPos => {
                    let newPos = prevPos + direction * speed;
                    if (newPos > 100 || newPos < 0) {
                        setDirection(dir => -dir);
                        newPos = Math.max(0, Math.min(100, newPos));
                    }
                    return newPos;
                });
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [direction, speed, gameState]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleCatchAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);


    const handleCatchAttempt = () => {
        if (gameState !== 'playing') return;

        if (position >= targetStart && position <= targetEnd) {
            const minMultiplier = 0.5;

            const accuracy = 1 - (Math.abs(50 - position) / (event.initialVariance / 2));
            const value = Math.round(event.targetValue * (minMultiplier + accuracy * (1 - minMultiplier)));
            
            setCollectedValue(value);
            setGameState('success');
            setTimeout(() => onCompletion(event.taskId, true, value), 1500);
        } else {
            setGameState('fail');
            setTimeout(() => onCompletion(event.taskId, false, 0), 1500);
        }
    };
    
    let resultMessage = '';
    let resultColor = '';
    if (gameState === 'success') {
        resultMessage = `УСПЕХ! ПОЛУЧЕНО ${collectedValue} КВИНТЭССЕНЦИИ`;
        resultColor = 'text-green-400';
    } else if (gameState === 'fail') {
        resultMessage = 'ПРОВАЛ! ЭССЕНЦИЯ ИСПАРИЛАСЬ';
        resultColor = 'text-red-500';
    }


    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
            <div className="w-full max-w-lg p-8 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-center">
                <h2 className="text-xl font-bold mb-2 text-[var(--accent-neon)]">Дистилляция Эссенции</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Нажмите "Дистиллировать" (или Пробел), когда курсор в зелёной зоне.</p>

                <div className="relative w-full h-8 bg-black/30 rounded-full overflow-hidden mb-6">
                    <div 
                        className="absolute h-full bg-green-500/30"
                        style={{ left: `${targetStart}%`, width: `${event.initialVariance}%` }}
                    ></div>
                    <div 
                        className="absolute top-0 h-full w-1.5 bg-[var(--accent-neon)] shadow-[0_0_8px_var(--accent-neon)]"
                        style={{ left: `${position}%` }}
                    ></div>
                </div>

                {gameState === 'playing' ? (
                     <button 
                        onClick={handleCatchAttempt}
                        className="px-6 py-3 bg-[var(--accent-soft)] text-black font-bold rounded-lg hover:bg-[var(--accent-neon)]"
                    >
                        Дистиллировать
                    </button>
                ) : (
                    <div className={`text-lg font-bold ${resultColor}`}>{resultMessage}</div>
                )}
            </div>
        </div>
    );
};

export default DistillationGame;
