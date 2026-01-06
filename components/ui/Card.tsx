import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${hoverable || onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-300' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
