import React, { useState, useRef } from 'react';
import { useAppData } from '../hooks/useAppData';
import ContextFilterModal from './ContextFilterModal';

type AppData = ReturnType<typeof useAppData>;

interface ContextFilterProps {
    appData: AppData;
    onViewSaved?: () => void;
}

const ContextFilter: React.FC<ContextFilterProps> = ({ appData, onViewSaved }) => {
    const { state, handlers, derivedState } = appData;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveIcon, setSaveIcon] = useState('📄');
    const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const canSaveView = state.searchQuery || state.activeTagFilter || state.activeContextIds.length > 0 || state.excludedContextIds.length > 0;

    const handleSave = () => {
        if (saveName.trim()) {
            handlers.handleSaveView(saveName.trim(), saveIcon);
            onViewSaved?.();
        }
        setIsSaving(false);
        setSaveName('');
        setSaveIcon('📄');
    };
    
    const getContextState = (contextId: string): 'included' | 'excluded' | 'off' => {
        if (state.activeContextIds.includes(contextId)) return 'included';
        if (state.excludedContextIds.includes(contextId)) return 'excluded';
        return 'off';
    }

    return (
        <details className="mb-4 p-3 bg-[var(--glass-bg)]/50 rounded-lg group">
             <summary className="list-none cursor-pointer text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-color)] flex justify-between items-center">
                <span>Фильтры и Контексты</span>
                <span className="transition-transform duration-200 group-open:rotate-180">▼</span>
            </summary>

            <div className="mt-4 space-y-4">
                {isModalOpen && (
                    <ContextFilterModal
                        allTags={derivedState.allTags}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handlers.handleAddContext}
                    />
                )}

                {/* Contexts Section */}
                <div className="flex flex-wrap gap-2 items-center">
                    {state.contexts.map(context => {
                        const contextState = getContextState(context.id);
                        const buttonClasses = {
                            'off': 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30',
                            'included': 'bg-green-500/30 text-green-300 ring-2 ring-green-400',
                            'excluded': 'bg-red-500/30 text-red-300 line-through ring-2 ring-red-500'
                        };
                        return (
                            <button
                                key={context.id}
                                onClick={() => handlers.handleCycleContextState(context.id)}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${buttonClasses[contextState]}`}
                            >
                                {context.name}
                            </button>
                        )
                    })}
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-2 py-1 border border-dashed border-[var(--accent-soft)]/50 rounded-md text-[var(--accent-soft)]/70 hover:bg-[var(--accent-soft)]/20 hover:text-[var(--accent-soft)] text-xs"
                        title="Создать новый контекст"
                    >
                        + Контекст
                    </button>
                </div>

                {/* Logic and Save Section */}
                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-md">
                        <button
                            onClick={() => handlers.setContextLogic('AND')}
                            className={`px-2 py-0.5 text-xs rounded ${state.contextLogic === 'AND' ? 'bg-[var(--accent-soft)] text-black' : 'text-[var(--text-secondary)]'}`}
                        >
                            И (Все)
                        </button>
                        <button
                            onClick={() => handlers.setContextLogic('OR')}
                            className={`px-2 py-0.5 text-xs rounded ${state.contextLogic === 'OR' ? 'bg-[var(--accent-soft)] text-black' : 'text-[var(--text-secondary)]'}`}
                        >
                            ИЛИ (Любой)
                        </button>
                    </div>

                    {isSaving ? (
                        <div className="flex items-center gap-2">
                             <input
                                type="text"
                                value={saveIcon}
                                onChange={(e) => setSaveIcon(e.target.value)}
                                className="bg-black/20 text-base p-2 rounded outline-none ring-1 ring-[var(--accent-neon)] w-12 text-center"
                                maxLength={2}
                            />
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') setIsSaving(false);
                                }}
                                placeholder="Имя вида..."
                                className="bg-black/20 text-xs p-2 rounded outline-none ring-1 ring-[var(--accent-neon)] w-28"
                                autoFocus
                            />
                            <button onClick={handleSave} className="text-xs p-2 rounded-md bg-[var(--accent-soft)]/30 text-[var(--accent-soft)]">OK</button>
                            <button onClick={() => { setIsSaving(false); setSaveName(''); }} className="text-xs p-2 rounded-md bg-gray-500/20 text-gray-300">✖</button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsSaving(true)} 
                            disabled={!canSaveView}
                            className="text-xs p-2 rounded-md bg-[var(--accent-soft)]/20 text-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Сохранить текущие фильтры как новый вид"
                        >
                            Сохранить вид
                        </button>
                    )}
                </div>
            </div>
        </details>
    );
};

export default ContextFilter;