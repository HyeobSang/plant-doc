// src/components/common/Card.jsx

import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm ${className}`} {...props}>
        {children}
    </div>
);

export const PageHeader = ({ title, description, actions }) => (
    <div className="flex items-start gap-3 justify-between flex-wrap">
        <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
            {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex gap-2 mt-1 sm:mt-0">{actions}</div>}
    </div>
);

export const MessageModal = ({ message, type, onClose }) => {
    if (!message) return null;

    let bgColor, textColor, borderColor;
    switch (type) {
        case 'error':
            bgColor = 'bg-red-50 dark:bg-red-900/20';
            textColor = 'text-red-700 dark:text-red-300';
            borderColor = 'border-red-200 dark:border-red-800';
            break;
        case 'success':
            bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
            textColor = 'text-emerald-700 dark:text-emerald-300';
            borderColor = 'border-emerald-200 dark:border-emerald-800';
            break;
        default:
            bgColor = 'bg-blue-50 dark:bg-blue-900/20';
            textColor = 'text-blue-700 dark:text-blue-300';
            borderColor = 'border-blue-200 dark:border-blue-800';
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl ${bgColor} border ${borderColor}`} onClick={(e) => e.stopPropagation()}>
                <p className={`font-medium ${textColor} mb-4`}>{message}</p>
                <button 
                    onClick={onClose} 
                    className={`w-full py-2 rounded-lg font-semibold bg-white dark:bg-zinc-800 border border-current ${textColor} hover:opacity-80 transition-opacity`}
                >
                    확인
                </button>
            </div>
        </div>
    );
};