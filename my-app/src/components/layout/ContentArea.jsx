// src/components/layout/ContentArea.jsx

import React, { useState, useEffect } from 'react';

import { NAV_ITEMS } from '../common/Icons';
import { ErrorBoundary } from '../common/ErrorBoundary';

// View Components Import
import DashboardView from '../views/DashboardView';
import DiagnoseView from '../views/DiagnoseView';
import MyDiagnosesView from '../views/MyDiagnosesView';
import ScheduleView from '../views/ScheduleView';
import FamilyView from '../views/FamilyView';
import PlaceholderView from '../views/PlaceholderView';

export default function ContentArea({ currentUser, familyInfo, familyMembers, diagnoses, prescriptions, onDiagnosisComplete }) {
    const [route, setRoute] = useState("dashboard");

    useEffect(() => {
        const onHash = () => setRoute(window.location.hash.replace('#/', '') || "dashboard");
        onHash();
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const familyId = currentUser.familyId;

    const routeMap = {
        dashboard: <DashboardView {...{ currentUser, familyMembers, diagnoses, prescriptions }} />,
        diagnose: <DiagnoseView {...{ currentUser, onDiagnosisComplete }} />,
        'my-diagnoses': <MyDiagnosesView {...{ currentUser, diagnoses }} />,
        schedule: <ScheduleView {...{ currentUser, familyId, familyMembers, prescriptions }} />,
        family: <ErrorBoundary><FamilyView {...{ currentUser, familyId, familyInfo, familyMembers, diagnoses }} /></ErrorBoundary>, 
        kb: <PlaceholderView title="지식 기반 (Knowledge Base)" />,
        settings: <PlaceholderView title="설정" />
    };

    const pageTitle = NAV_ITEMS.find(i => i.key === route)?.label || "대시보드";

    return (
        <main className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-6">
            <div className="p-4 lg:p-6">
                <nav className="text-sm text-zinc-500 mb-4" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2">
                        <li className="flex items-center gap-2">
                            <a href="#/dashboard" className="hover:underline">Plant Doctor</a>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="opacity-60">/</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{pageTitle}</span>
                        </li>
                    </ol>
                </nav>
            </div>
            {routeMap[route] || routeMap.dashboard}
        </main>
    );
}