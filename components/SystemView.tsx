import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { Quest } from '../types';

type AppData = ReturnType<typeof useAppData>;

const QuestItem: React.FC<{ quest: Quest, onClaim: (id: string) => void }> = ({ quest, onClaim }) => {
    const isComplete = quest.progress >= quest.progressGoal;
    const progressPercentage = Math.min((quest.progress / quest.progressGoal) * 100, 100);

    return (
        <div className={`p-4 rounded-lg border ${quest.claimed ? 'bg-green-500/10 border-green-500/30 opacity-60' : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold">{quest.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{quest.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-yellow-400">{quest.xpReward} XP</p>
                    {quest.type === 'daily' && (
                         <p className="text-xs text-[var(--text-secondary)]">{quest.progress} / {quest.progressGoal}</p>
                    )}
                </div>
            </div>
             {quest.type === 'daily' && (
                <div className="mt-3">
                    <div className="w-full bg-black/20 rounded-full h-2">
                        <div 
                            className="bg-[var(--accent-soft)] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%`}}
                        ></div>
                    </div>
                </div>
            )}
            {isComplete && !quest.claimed && (
                <div className="mt-3 text-right">
                    <button 
                        onClick={() => onClaim(quest.id)}
                        className="px-4 py-2 bg-[var(--accent-neon)] text-black font-semibold rounded-md text-sm hover:bg-[var(--accent-soft)]"
                    >
                        Получить награду
                    </button>
                </div>
            )}
        </div>
    )
};


const SystemView: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { state, handlers } = appData;
    const { quests } = state;

    const dailyQuests = quests.filter(q => q.type === 'daily' && !q.claimed);
    const completedQuests = quests.filter(q => q.claimed);

    return (
        <div className="h-full pr-2 text-[var(--text-color)]">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-400">Система</h1>
                <p className="text-[var(--text-secondary)]">Ежедневные задания и отслеживание прогресса.</p>
            </header>
            
            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-[var(--accent-soft)] pb-2">Ежедневные квесты</h2>
                    {dailyQuests.length > 0 ? (
                        <div className="space-y-4">
                            {dailyQuests.map(q => <QuestItem key={q.id} quest={q} onClaim={handlers.claimQuestReward} />)}
                        </div>
                    ) : (
                        <p className="text-center text-[var(--text-secondary)] p-4">Ежедневные квесты на сегодня выполнены. Новые появятся в полночь.</p>
                    )}
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold mb-4 border-b-2 border-[var(--glass-border)] pb-2">Выполненные</h2>
                    {completedQuests.length > 0 ? (
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                             {completedQuests.map(q => <QuestItem key={q.id} quest={q} onClaim={handlers.claimQuestReward} />)}
                        </div>
                    ) : (
                         <p className="text-center text-[var(--text-secondary)] p-4">Здесь будут отображаться выполненные квесты.</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default SystemView;
