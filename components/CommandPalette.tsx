import React, { useState, useEffect, useRef } from 'react';
import { useCommandPalette, CommandAction } from '../hooks/useCommandPalette';
import { useAppData } from '../hooks/useAppData';

type AppData = ReturnType<typeof useAppData>;

interface CommandPaletteProps {
    isVisible: boolean;
    onClose: () => void;
    appData: AppData;
    onSelect: (action: CommandAction) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isVisible, onClose, appData, onSelect }) => {
    const { query, setQuery, filteredActions } = useCommandPalette(appData);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isVisible) {
            inputRef.current?.focus();
            setQuery(''); // Reset query on open
        }
    }, [isVisible, setQuery]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredActions]);

    useEffect(() => {
        if (selectedIndex > -1) {
            resultsRef.current?.children[selectedIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredActions[selectedIndex]) {
                onSelect(filteredActions[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };
    
    if (!isVisible) return null;

    let lastCategory = '';

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20"
            onClick={onClose}
        >
            <div 
                className={`command-palette-container w-full max-w-xl bg-[var(--bg-container)] border border-[var(--glass-border)] rounded-lg shadow-2xl shadow-[var(--shadow-color)] ${isVisible ? 'visible' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3 border-b border-[var(--glass-border)]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Искать задачи, команды..."
                        className="w-full bg-transparent text-lg text-[var(--text-color)] placeholder:text-[var(--text-secondary)] outline-none"
                    />
                </div>
                <ul ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredActions.length > 0 ? filteredActions.map((action, index) => {
                        const showCategory = action.category !== lastCategory;
                        lastCategory = action.category;
                        return (
                            <React.Fragment key={action.id}>
                                {showCategory && (
                                    <li className="px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                        {action.category}
                                    </li>
                                )}
                                <li>
                                    <button
                                        onClick={() => onSelect(action)}
                                        className={`w-full flex items-center gap-3 text-left p-3 rounded-md transition-colors ${
                                            index === selectedIndex ? 'bg-[var(--accent-soft)]/20 text-[var(--accent-neon)]' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-color)]'
                                        }`}
                                    >
                                        <span className="text-lg">{action.icon}</span>
                                        <span className="flex-grow">{action.title}</span>
                                    </button>
                                </li>
                            </React.Fragment>
                        );
                    }) : (
                        <li className="p-4 text-center text-[var(--text-secondary)]">Ничего не найдено.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
