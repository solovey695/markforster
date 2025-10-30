import React, { useState } from 'react';

interface ContextFilterModalProps {
    allTags: string[];
    onClose: () => void;
    onSave: (name: string, tags: string[]) => void;
}

const ContextFilterModal: React.FC<ContextFilterModalProps> = ({ allTags, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), selectedTags);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--bg-container)] p-6 rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Создать новый контекст</h3>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Название контекста..."
                    className="w-full bg-[var(--glass-bg)] p-2 rounded mb-4"
                />
                <h4 className="font-semibold mb-2 text-sm">Выберите теги:</h4>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-black/20 rounded">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                selectedTags.includes(tag)
                                    ? 'bg-[var(--accent-neon)] text-black font-semibold'
                                    : 'bg-[var(--accent-soft)]/20 text-[var(--accent-soft)]'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--glass-bg)] rounded-md">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-[var(--accent-neon)] text-white rounded-md">Сохранить</button>
                </div>
            </div>
        </div>
    );
};

export default ContextFilterModal;