import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { PlayerStats } from '../types';

type AppData = ReturnType<typeof useAppData>;

const StatRow: React.FC<{
    label: string;
    value: number;
    canAllocate: boolean;
    onAllocate: () => void;
}> = ({ label, value, canAllocate, onAllocate }) => (
    <div className="flex justify-between items-center">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
            <span className="font-semibold">{value}</span>
            {canAllocate && (
                <button 
                    onClick={onAllocate}
                    className="w-5 h-5 bg-[var(--accent-soft)] text-black rounded-full text-sm font-bold leading-none hover:bg-[var(--accent-neon)]"
                >
                    +
                </button>
            )}
        </div>
    </div>
);

const PlayerStatus: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { playerState } = appData.state;
    const { handlers } = appData;

    const xpPercentage = (playerState.xp / playerState.xpToNextLevel) * 100;

    const handleAllocate = (stat: keyof PlayerStats) => {
        handlers.allocateStatPoint(stat);
    };

    return (
        <div className="text-sm">
            <div className="text-center mb-3">
                <h2 className="font-bold text-lg text-[var(--text-color)]">{playerState.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{playerState.title}</p>
            </div>

            <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold">Ур. {playerState.level}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{playerState.xp} / {playerState.xpToNextLevel} XP</span>
                </div>
                <div className="w-full bg-[var(--glass-bg)] rounded-full h-2.5">
                    <div className="bg-[var(--accent-neon)] h-2.5 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
                </div>
            </div>

            <div className="space-y-1">
                <StatRow label="Сила" value={playerState.stats.strength} canAllocate={playerState.unallocatedStatPoints > 0} onAllocate={() => handleAllocate('strength')} />
                <StatRow label="Ловкость" value={playerState.stats.agility} canAllocate={playerState.unallocatedStatPoints > 0} onAllocate={() => handleAllocate('agility')} />
                <StatRow label="Живучесть" value={playerState.stats.vitality} canAllocate={playerState.unallocatedStatPoints > 0} onAllocate={() => handleAllocate('vitality')} />
                <StatRow label="Интеллект" value={playerState.stats.intelligence} canAllocate={playerState.unallocatedStatPoints > 0} onAllocate={() => handleAllocate('intelligence')} />
                <StatRow label="Восприятие" value={playerState.stats.sense} canAllocate={playerState.unallocatedStatPoints > 0} onAllocate={() => handleAllocate('sense')} />
            </div>
            
            {playerState.unallocatedStatPoints > 0 && (
                <div className="mt-3 text-center text-xs p-2 bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] rounded-md">
                    У вас <span className="font-bold">{playerState.unallocatedStatPoints}</span> очк. для распределения
                </div>
            )}
        </div>
    );
};

export default PlayerStatus;
