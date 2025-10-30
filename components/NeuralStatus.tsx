import React from 'react';
import { useAppData } from '../hooks/useAppData';

type AppData = ReturnType<typeof useAppData>;

const AlchemyStatus: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { alchemyState } = appData.state;
    const { quintessence, homunculus } = alchemyState;
    const totalQuintessence = quintessence.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="text-xs space-y-2 px-2">
            <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Квинтэссенция:</span>
                <span className="font-semibold text-[var(--accent-soft)]">{totalQuintessence}</span>
            </div>
            {homunculus && (
                 <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Гомункул:</span>
                    <span className={`font-semibold ${homunculus.isActive ? 'text-[var(--completed)]' : 'text-[var(--undone)]'}`}>
                        {homunculus.isActive ? 'Пробужден' : 'Дремлет'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AlchemyStatus;