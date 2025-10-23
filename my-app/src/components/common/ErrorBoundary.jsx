// src/components/common/ErrorBoundary.jsx

import React from 'react';
import { Card } from './Card'; // Card 컴포넌트 import 필요
import { Icon } from './Icons'; // Icon 컴포넌트 import 필요

// Error Boundary Component
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-red-600 mb-2">오류가 발생했습니다</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
                        </p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            새로고침
                        </button>
                    </Card>
                </div>
            );
        }
        
        return this.props.children;
    }
}