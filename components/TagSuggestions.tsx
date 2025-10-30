import React, { useEffect, useRef } from 'react';

interface TagSuggestionsProps {
    suggestions: string[];
    position: { top: number; left: number };
    selectedIndex: number;
    onSelect: (tag: string) => void;
    onClose: () => void;
}

const TagSuggestions: React.FC<TagSuggestionsProps> = ({ suggestions, position, selectedIndex, onSelect, onClose }) => {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        listRef.current?.children[selectedIndex]?.scrollIntoView({
            block: 'nearest',
            inline: 'start',
        });
    }, [selectedIndex]);

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <ul
            ref={listRef}
            className="absolute z-10 w-48 bg-[var(--bg-container)] border border-[var(--glass-border)] rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            {suggestions.map((tag, index) => (
                <li key={tag}>
                    <button
                        onClick={() => onSelect(tag)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                            index === selectedIndex ? 'bg-[var(--accent-soft)]/20 text-[var(--accent-neon)]' : 'text-[var(--text-secondary)] hover:bg-white/5'
                        }`}
                    >
                        {tag}
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default TagSuggestions;
