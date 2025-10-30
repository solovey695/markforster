import React, { useState, useEffect, useRef } from 'react';

interface QuickNoteModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (noteText: string) => void;
}

const QuickNoteModal: React.FC<QuickNoteModalProps> = ({ isVisible, onClose, onSave }) => {
    const [note, setNote] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => inputRef.current?.focus(), 100);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onClose]);

    useEffect(() => {
        if (!isVisible) {
            setNote('');
        }
    }, [isVisible]);

    const handleSave = () => {
        if (note.trim()) {
            onSave(note.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className={`command-palette-container w-full max-w-xl bg-[var(--bg-container)] border border-[var(--glass-border)] rounded-lg shadow-2xl shadow-[var(--shadow-color)] ${isVisible ? 'visible' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Например: Проверить ПР #работа *2"
                        className="w-full bg-transparent text-lg text-[var(--text-color)] placeholder:text-[var(--text-secondary)] outline-none"
                    />
                </div>
                <div className="flex justify-between items-center p-2 border-t border-[var(--glass-border)] bg-black/10 text-xs text-[var(--text-secondary)]">
                    <span>
                        <kbd className="px-1.5 py-0.5 font-sans font-semibold text-xs bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded">#</kbd> тег
                        <span className="mx-2">•</span>
                        <kbd className="px-1.5 py-0.5 font-sans font-semibold text-xs bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded">*</kbd> приоритет (1-3)
                    </span>
                    <span>Нажмите <kbd className="px-1.5 py-0.5 font-sans font-semibold text-xs bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded">Enter</kbd> для сохранения</span>
                </div>
            </div>
        </div>
    );
};

export default QuickNoteModal;