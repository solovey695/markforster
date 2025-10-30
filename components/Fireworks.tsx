import React, { useEffect, useRef } from 'react';

interface FireworksProps {
    onAnimationEnd: () => void;
}

const Fireworks: React.FC<FireworksProps> = ({ onAnimationEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const particleCount = 150;
    const animationDuration = 2000; // in ms

    useEffect(() => {
        const timer = setTimeout(onAnimationEnd, animationDuration);
        return () => clearTimeout(timer);
    }, [onAnimationEnd]);

    const particles = Array.from({ length: particleCount }).map((_, i) => {
        const angle = (360 / particleCount) * i;
        const distance = Math.random() * 80 + 50;
        const x = Math.cos(angle * (Math.PI / 180)) * distance;
        const y = Math.sin(angle * (Math.PI / 180)) * distance;
        const hue = Math.random() * 360; // Full spectrum
        const size = Math.random() * 2 + 2; // size from 2 to 4px
        const duration = Math.random() * 500 + (animationDuration * 0.7);

        return (
            <div
                key={i}
                className="firework-particle"
                style={{
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    '--hue': `${hue}`,
                    '--size': `${size}px`,
                    'animationDuration': `${duration}ms`,
                    'animationDelay': `${Math.random() * 200}ms`
                } as React.CSSProperties}
            />
        );
    });

    return (
        <div ref={containerRef} className="fireworks-container">
            {particles}
        </div>
    );
};

export default Fireworks;