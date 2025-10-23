// src/components/common/Icons.jsx

import React from 'react';

export const Icon = {
    logo: (className = "w-6 h-6") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2c-2 4-5 6-9 6 2 3 5 4 9 4s7-1 9-4c-4 0-7-2-9-6Zm-1 11.1C9.2 16.1 6.8 18 3 18c2.5 3 5.3 4 8.9 4 3.7 0 6.6-1 9.1-4-3.9 0-6.3-1.9-8-4.9l-.9 0Z"/></svg>),
    dashboard: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 0h11v8H10v-8Z"/></svg>),
    diagnose: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V2Zm1 3h-2v4H7v2h4v4h2v-4h4V9h-4V5Z"/></svg>),
    schedule: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M7 2v2H4a2 2 0 0 0-2 2v2h20V6a2 2 0 0 0-2-2h-3V2h-2v2H9V2H7Zm15 8H2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10Zm-9 3h2v5h-2v-5Z"/></svg>),
    kb: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M4 3h11a4 4 0 0 1 4 4v12.5a.5.5 0 0 1-.8.4L15 17H6a2 2 0 0 1-2-2V3Zm2 2v10h8.5l2.5 1.9V7a2 2 0 0 0-2-2H6Z"/></svg>),
    family: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a6 6 0 0 0-6 6c0 2.8 1.9 5.2 4.5 5.8l-.2 5.2a1 1 0 0 0 2 0l-.2-5.2C14.1 13.2 16 10.8 16 8a6 6 0 0 0-6-6Zm0 2a4 4 0 0 1 4 4c0 1.9-1.2 3.6-3 4.4v1.6a1 1 0 0 0 2 0v-.5l2.2-.4a4 4 0 0 1 1.6 3.4c0 3.3-2.9 6-6.8 6-3.8 0-6.8-2.7-6.8-6a4 4 0 0 1 1.6-3.4l2.2.4v.5a1 1 0 0 0 2 0v-1.6C8.2 11.6 7 9.9 7 8a4 4 0 0 1 4-4Z"/></svg>),
    settings: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.9 2.6 2.1 1.2-2 3.6-2.3-.5a7.98 7.98 0 0 1-1.7 1l-.5 2.4H9.5l-.5-2.4a7.98 7.98 0 0 1-1.7-1l-2.3.5-2-3.6 2.1-1.2a7.5 7.5 0 0 1 0-1.2L.99 8.2l2-3.6 2.3.5c.5-.4 1-.7 1.6-.9l.5-2.4h6.1l.5 2.4c.6.2 1.1.5 1.6.9l2.3-.5 2 3.6-2.1 1.2c.1.4.1.8 0 1.2Z"/></svg>),
    menu: (className = "w-6 h-6") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/></svg>),
    loading: (className = "w-5 h-5") => (<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>),
    plus: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M11 13h-4v-2h4v-4h2v4h4v2h-4v4h-2v-4Z"/></svg>),
    copy: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>)
};

export const NAV_ITEMS = [
    { label: "대시보드", key: "dashboard", icon: Icon.dashboard(), href: "#/dashboard" },
    { label: "진단 시작", key: "diagnose", icon: Icon.diagnose(), href: "#/diagnose" },
    { label: "나의 진단 기록", key: "my-diagnoses", icon: Icon.diagnose(), href: "#/my-diagnoses" },
    { label: "처방 스케줄", key: "schedule", icon: Icon.schedule(), href: "#/schedule" },
    { label: "가족 공유", key: "family", icon: Icon.family(), href: "#/family" },
    { label: "지식 기반", key: "kb", icon: Icon.kb(), href: "#/kb" },
    { label: "설정", key: "settings", icon: Icon.settings(), href: "#/settings" }
];