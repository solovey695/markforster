import React from 'react';

const CircleTracker: React.FC<{ completedCount: number }> = ({ completedCount }) => {
    const circles = Array.from({ length: 164 }, (_, i) => (
        <div key={i} className={`w-3 h-3 rounded-full border border-[var(--accent-soft)]/50 ${i < completedCount ? 'bg-[var(--accent-neon)]' : ''}`}></div>
    ));
    return <div className="flex flex-wrap gap-1 justify-center mt-4">{circles}</div>;
};

export default CircleTracker;
