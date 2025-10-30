import { useState, useEffect, useCallback } from 'react';

export const useTimer = (duration: number) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isActive) {
            const id = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(id);
                        setIsActive(false);
                        return duration;
                    }
                    return prev - 1;
                });
            }, 1000);
            setIntervalId(id);
        } else if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, duration]);
    
    const start = useCallback(() => {
        setIsActive(true);
        setTimeLeft(duration);
    }, [duration]);
    
    const stop = useCallback(() => {
        setIsActive(false);
        if (intervalId) clearInterval(intervalId);
        setTimeLeft(duration);
        setIntervalId(null);
    }, [duration, intervalId]);

    const toggle = useCallback(() => {
        if (isActive) {
            stop();
        } else {
            start();
        }
    }, [isActive, start, stop]);

    return { timeLeft, isActive, toggle };
};
