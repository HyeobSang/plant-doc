// src/utils/helpers.js

const formatDate = (dateString) => {
    if (!dateString) return '오늘 중';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';

    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

// UUID를 읽기 쉬운 6자리 코드로 변환 (초대 코드 생성용)
const generateInviteCode = () => crypto.randomUUID().substring(0, 6).toUpperCase();

// 진단 상세 보기에서 사용할 날짜 포맷
const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 심각도에 따른 TailwindCSS 클래스
const getSeverityColor = (severity) => {
    switch (severity) {
        case 'Severe': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
        case 'Moderate': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';
        case 'Mild': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
        case 'Healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
        default: return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-300';
    }
};

const getSeverityIcon = (severity) => {
    switch (severity) {
        case 'Severe': return '🚨';
        case 'Moderate': return '⚠️';
        case 'Mild': return '⚡';
        case 'Healthy': return '✅';
        default: return '❓';
    }
};

export { 
    formatDate, 
    generateInviteCode, 
    formatFullDate, 
    getSeverityColor, 
    getSeverityIcon 
};