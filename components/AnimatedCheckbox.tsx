import React from 'react';

interface AnimatedCheckboxProps {
    completed: boolean;
    onClick: (event: React.MouseEvent<SVGSVGElement>) => void;
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ completed, onClick }) => {
    return (
        <svg
            className={`animated-checkbox ${completed ? 'completed' : ''}`}
            onClick={onClick}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={completed ? 'Отметить задачу как невыполненную' : 'Отметить задачу как выполненную'}
        >
            <circle
                className="checkbox-circle"
                cx="12"
                cy="12"
                r="10"
                strokeWidth="2"
            />
            <path
                className="checkbox-checkmark"
                d="M7 13l3 3 7-7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default AnimatedCheckbox;