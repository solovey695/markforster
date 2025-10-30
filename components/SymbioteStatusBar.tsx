import React from 'react';
import { HomunculusState } from '../types';
import { RESONANCE_THRESHOLD_MIN, RESONANCE_THRESHOLD_MAX, STABILIZE_CONCOCTION_COST, STABILIZE_CONCOCTION_AMOUNT } from '../constants';

interface ConcoctionStatusBarProps {
    homunculus: HomunculusState;
    onStabilize: () => void;
}

const ConcoctionStatusBar: React.FC<ConcoctionStatusBarProps> = ({ homunculus, onStabilize }) => {
    const volatility = Math.min(homunculus.volatility, 100);
    const resonanceWidth = RESONANCE_THRESHOLD_MAX - RESONANCE_THRESHOLD_MIN;

    const isResonating = volatility >= RESONANCE_THRESHOLD_MIN && volatility <= RESONANCE_THRESHOLD_MAX;

    return (
        <div className="mb-4 p-3 bg-black/30 rounded-lg border border-[var(--glass-border)]">
            <div className="flex justify-between items-center mb-2">
                <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${isResonating ? 'text-green-300 animate-pulse' : 'text-[var(--text-secondary)]'}`}>
                    {isResonating ? 'Алхимический Поток' : 'Нестабильная Смесь'}
                </h3>
                <button
                    onClick={onStabilize}
                    className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/40 border border-cyan-500/30"
                    title={`Потратить ${STABILIZE_CONCOCTION_COST} квинтэссенции, чтобы снизить нестабильность на ${STABILIZE_CONCOCTION_AMOUNT}`}
                >
                    Стабилизировать
                </button>
            </div>
            <div className="relative w-full h-4 bg-[var(--glass-bg)] rounded-full overflow-hidden border border-black/50">
                {/* Resonance Zone */}
                <div
                    className="absolute h-full bg-green-500/20"
                    style={{
                        left: `${RESONANCE_THRESHOLD_MIN}%`,
                        width: `${resonanceWidth}%`,
                    }}
                />
                
                {/* Volatility Bar */}
                <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
                    style={{
                        width: `${volatility}%`,
                        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5), 0 0 5px #4ade80',
                        backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)`
                    }}
                />

                {/* Overload Warning Gradient */}
                {volatility > 80 && (
                    <div
                        className="absolute top-0 left-0 h-full w-full rounded-full"
                        style={{
                            backgroundImage: `radial-gradient(circle at ${volatility}% 50%, rgba(255, 0, 0, 0.5) 0%, rgba(255, 0, 0, 0) 40%)`,
                            animation: 'pulse-red 1s infinite'
                        }}
                    />
                )}
            </div>
             <style>{`
                @keyframes pulse-red {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default ConcoctionStatusBar;