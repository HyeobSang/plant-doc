// src/components/views/DashboardView.jsx

import React from 'react';
import { Card, PageHeader } from '../common/Card';
import { Icon } from '../common/Icons';
import { formatDate, getSeverityColor } from '../../utils/helpers';

export default function DashboardView({ familyMembers, diagnoses, prescriptions }) {
    const activePrescriptions = prescriptions.filter(p => p.status === 'active').length;
    const tasksDueToday = prescriptions
        .flatMap(p => p.tasks_json.map(t => ({ ...t, plantName: p.plantName, userName: p.userName, prescriptionId: p.id })))
        .filter(t => t.status === 'todo' && t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString()).length;

    return (
        <div className="space-y-6">
            <PageHeader 
                title="대시보드" 
                description="오늘의 관리 현황 및 최근 활동" 
                actions={
                    <a href="#/diagnose" className="rounded-xl px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 text-sm font-semibold">
                        {Icon.plus()} <span>진단 시작</span>
                    </a>
                }
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="text-sm text-zinc-500">활성 처방</div>
                    <div className="text-3xl font-bold mt-1 text-emerald-600">{activePrescriptions}</div>
                </Card>
                <Card>
                    <div className="text-sm text-zinc-500">오늘 할 일</div>
                    <div className="text-3xl font-bold mt-1 text-amber-600">{tasksDueToday}</div>
                </Card>
                <Card>
                    <div className="text-sm text-zinc-500">가족 수</div>
                    <div className="text-3xl font-bold mt-1 text-blue-600">{familyMembers.length}명</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <h2 className="font-semibold mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">최근 진단 이력 (가족 공유)</h2>
                    <ul className="space-y-3">
                        {diagnoses.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3).map(d => (
                            <li key={d.diagnosisId} className="text-sm flex justify-between items-center">
                                <div>
                                    <span className="font-medium">{d.plantName || '식물'}</span> ({d.userName})
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(d.severityLevel)}`}>
                                    {d.severityLevel === 'Healthy' ? '건강' : d.severityLevel}
                                </span>
                            </li>
                        ))}
                        {diagnoses.length === 0 && <p className="text-zinc-500 text-sm">아직 진단 기록이 없습니다.</p>}
                    </ul>
                </Card>
                <Card>
                    <h2 className="font-semibold mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">다가오는 처방 Task</h2>
                    <ul className="space-y-3">
                        {prescriptions
                            .flatMap(p => p.tasks_json.map(t => ({ ...t, plantName: p.plantName, userName: p.userName, prescriptionId: p.id })))
                            .filter(t => t.status === 'todo' && t.dueAt)
                            .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
                            .slice(0, 3)
                            .map((task, index) => (
                                <li key={task.prescriptionId + task.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium">[{task.plantName}] {task.title.replace('[긴급] ', '')}</span>
                                    <span className={`text-xs font-semibold ${new Date(task.dueAt).toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-zinc-500'}`}>{formatDate(task.dueAt)}</span>
                                </li>
                            ))
                        }
                        {tasksDueToday === 0 && prescriptions.length > 0 && <p className="text-zinc-500 text-sm">오늘 처리할 Task가 없습니다. 잘하고 있어요!</p>}
                        {prescriptions.length === 0 && <p className="text-zinc-500 text-sm">진단 후 처방 스케줄을 생성해 보세요.</p>}
                    </ul>
                </Card>
            </div>
        </div>
    );
}