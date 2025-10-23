// src/App.jsx (최종)

import React, { useState, useEffect } from 'react';

// Hooks
import useAuth from './hooks/useAuth';
import useFamilyData from './hooks/useFamilyData';

// Layout & Common
import ContentArea from './components/layout/ContentArea';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AuthView from './components/auth/AuthView';
import { db } from './api/firebase';
import { Icon } from './components/common/Icons';

export default function App() {
    const [open, setOpen] = useState(false);
    
    // 1. 인증 및 사용자 프로필 관리
    const { 
        currentUser, 
        authLoading, 
        handleSignOut, 
        handleAuthSuccess 
    } = useAuth();

    // 2. 가족 데이터 관리
    const { 
        familyInfo, 
        familyMembers, 
        diagnoses, 
        prescriptions 
    } = useFamilyData(currentUser?.familyId);

    // [중략: 폰트 로딩 코드는 그대로 유지]

    if (authLoading || !db) { /* ... 로딩 화면 ... */ }
    if (!currentUser) { return <AuthView onAuthSuccess={handleAuthSuccess} />; }
    
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-inter">
            <Sidebar open={open} setOpen={setOpen} onSignOut={handleSignOut} currentUser={currentUser} />
            <div className="lg:pl-72">
                <Topbar onMenu={() => setOpen(true)} />
                <ContentArea 
                    currentUser={currentUser} 
                    familyInfo={familyInfo}
                    familyMembers={familyMembers}
                    diagnoses={diagnoses}
                    prescriptions={prescriptions}
                    onDiagnosisComplete={() => {}}
                />
            </div>
            {/* ... 모바일 탭바 ... */}
        </div>
    );
}

