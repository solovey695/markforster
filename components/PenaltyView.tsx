import React, { useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PENALTY_QUEST_DEFINITION } from '../constants';

type AppData = ReturnType<typeof useAppData>;

const PenaltyView: React.FC<{ appData: AppData }> = ({ appData }) => {
    const { handlers } = appData;

    const penaltyQuest = useMemo(() => {
        const oldestTasks = [...appData.state.tasks]
            .filter(t => !t.completed && !t.undone && !t.hidden)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(0, 10);
        return {
            ...PENALTY_QUEST_DEFINITION,
            tasks: oldestTasks,
        };
    }, [appData.state.tasks]);


    const handleAccept = () => {
        handlers.acceptPenaltyQuest(penaltyQuest.tasks);
    }
    
    return (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4 penalty-bg">
             <style>{`
                .penalty-bg {
                    background-color: #1a0000;
                    background-image:
                        repeating-linear-gradient(0deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 1px, transparent 1px, transparent 2px),
                        repeating-linear-gradient(90deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 1px, transparent 1px, transparent 2px);
                    animation: glitch 0.5s infinite;
                }
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-3px, 3px); }
                    40% { transform: translate(-3px, -3px); }
                    60% { transform: translate(3px, 3px); }
                    80% { transform: translate(3px, -3px); }
                    100% { transform: translate(0); }
                }
                .penalty-box {
                    animation: text-flicker 3s linear infinite;
                }
                @keyframes text-flicker {
                    0% { opacity:0.1; text-shadow: 0 0 5px #ff0000; }
                    2% { opacity:1; text-shadow: 0 0 5px #ff0000; }
                    8% { opacity:0.1; text-shadow: 0 0 5px #ff0000; }
                    9% { opacity:1; text-shadow: 0 0 5px #ff0000; }
                    12% { opacity:0.1; text-shadow: 0 0 5px #ff0000; }
                    20% { opacity:1; text-shadow: 0 0 10px #ff0000; }
                    25% { opacity:0.3; text-shadow: 0 0 10px #ff0000; }
                    30% { opacity:1; text-shadow: 0 0 10px #ff0000; }
                    70% { opacity:0.7; text-shadow: 0 0 10px #ff0000; }
                    72% { opacity:0.2; text-shadow: 0 0 10px #ff0000; }
                    77% { opacity:0.9; text-shadow: 0 0 20px #ff0000; }
                    100% { opacity:0.9; text-shadow: 0 0 20px #ff0000; }
                }
            `}</style>
            <div className="w-full max-w-2xl bg-black/80 border-2 border-red-500 rounded-lg p-8 text-center text-red-400 font-mono shadow-[0_0_20px_rgba(255,0,0,0.5)] penalty-box">
                <h1 className="text-3xl md:text-5xl font-bold text-red-500 mb-4 tracking-widest">[! ВНИМАНИЕ !]</h1>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">ВЫДАН ШТРАФНОЙ КВЕСТ</h2>
                <div className="text-left bg-red-900/20 p-4 rounded-md border border-red-500/50 mb-6">
                    <p className="font-bold text-white mb-2">{penaltyQuest.title}</p>
                    <p className="text-sm">{penaltyQuest.description}</p>
                </div>

                <p className="text-sm mb-6">Следующие <span className="font-bold text-white">{penaltyQuest.tasks.length}</span> задач были помечены для разбора:</p>
                
                <ul className="text-xs text-left max-h-40 overflow-y-auto bg-black/30 p-2 rounded mb-6 space-y-1">
                    {penaltyQuest.tasks.map(t => <li key={t.id} className="truncate"> - {t.text}</li>)}
                </ul>

                <button 
                    onClick={handleAccept}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold text-lg rounded-md hover:bg-red-500 transition-colors border-2 border-red-400 shadow-[0_0_15px_rgba(255,100,100,0.7)]"
                >
                    Принять
                </button>
            </div>
        </div>
    );
};

export default PenaltyView;
