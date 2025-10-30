import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { TRANSMUTATION_COST, ALCHEMY_FORMULAE } from '../constants';
import { Upgrade } from '../types';

type AppData = ReturnType<typeof useAppData>;

const FormulaCard: React.FC<{
    formula: Upgrade;
    isResearched: boolean;
    canAfford: boolean;
    onResearch: (id: string) => void;
}> = ({ formula, isResearched, canAfford, onResearch }) => {
    return (
        <div className={`p-4 rounded-lg border ${isResearched ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'}`}>
            <h4 className="font-bold text-[var(--text-color)]">{formula.name}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{formula.description}</p>
            <div className="mt-3 flex justify-between items-center">
                <span className={`text-sm font-semibold ${canAfford || isResearched ? 'text-yellow-400' : 'text-red-500'}`}>
                    {formula.cost} квинтэссенции
                </span>
                {isResearched ? (
                    <span className="text-sm font-bold text-green-400">Изучено</span>
                ) : (
                    <button
                        onClick={() => onResearch(formula.id)}
                        disabled={!canAfford}
                        className="px-3 py-1 text-xs bg-[var(--accent-soft)] text-black rounded disabled:bg-gray-500 disabled:opacity-50"
                    >
                        Изучить
                    </button>
                )}
            </div>
        </div>
    );
};

const AlchemistsLab: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { state, handlers } = appData;
    const { alchemyState } = state;
    const { quintessence, homunculus, researchedFormulae } = alchemyState;
    const totalQuintessence = quintessence.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="h-full pr-2 text-[var(--text-color)]">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-amber-400">Лаборатория Алхимика</h1>
                <p className="text-[var(--text-secondary)]">Преобразуйте усилия в чистое мастерство.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Panel: Quintessence & Homunculus */}
                <div className="space-y-6">
                    <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-center">
                        <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Квинтэссенция</h2>
                        <p className="text-4xl font-bold text-[var(--accent-soft)]">{totalQuintessence}</p>
                    </div>

                    <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg">
                        <h2 className="text-lg font-bold mb-4 text-center">Трансмутационный Круг</h2>
                        <p className="text-sm text-[var(--text-secondary)] text-center mb-4">
                            Потратьте <span className="font-semibold text-yellow-400">{TRANSMUTATION_COST}</span> квинтэссенции, чтобы создать или улучшить Гомункула.
                        </p>
                        <button
                            onClick={handlers.handlePerformTransmutation}
                            disabled={totalQuintessence < TRANSMUTATION_COST}
                            className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 disabled:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                            Трансмутировать
                        </button>
                    </div>

                    {homunculus && (
                        <div className="p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg">
                             <h2 className="text-lg font-bold mb-4 text-center">Гомункул: {homunculus.name}</h2>
                             <div className="text-center">
                                 <p className={`text-2xl font-bold mb-2 ${homunculus.isActive ? 'text-green-400 animate-pulse' : 'text-red-500'}`}>
                                     {homunculus.isActive ? 'ПРОБУЖДЕН' : 'ДРЕМЛЕТ'}
                                 </p>
                                 <ul className="text-sm text-[var(--text-secondary)] list-disc list-inside mb-4">
                                     {homunculus.abilities.map((ability, i) => <li key={i}>{ability}</li>)}
                                 </ul>
                                 {!homunculus.isActive && (
                                     <button
                                         onClick={handlers.handleAwakenHomunculus}
                                         className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-colors"
                                     >
                                         Пробудить
                                     </button>
                                 )}
                             </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Upgrades */}
                <div className="space-y-4">
                     <h2 className="text-xl font-bold mb-4 text-center">Алхимические Формулы</h2>
                     {ALCHEMY_FORMULAE.map(formula => (
                         <FormulaCard
                            key={formula.id}
                            formula={formula}
                            isResearched={researchedFormulae.includes(formula.id)}
                            canAfford={totalQuintessence >= formula.cost}
                            onResearch={handlers.handleResearchFormula}
                         />
                     ))}
                </div>
            </div>
        </div>
    );
};

export default AlchemistsLab;