// src/components/views/ScheduleView.jsx

import React, { useState, useEffect } from 'react';
import { doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';

import { db, COLLECTIONS } from '../../api/firebase';
import { Card, PageHeader, MessageModal } from '../common/Card';
import { formatDate } from '../../utils/helpers';

export default function ScheduleView({ familyId, prescriptions: prescriptionsProp }) {
    const [tasks, setTasks] = useState([]);
    const [plantGroups, setPlantGroups] = useState([]);
    const [expandedPlants, setExpandedPlants] = useState(new Set());
    const [modal, setModal] = useState({ message: '', type: '' });
    
    // prescriptionsProp이 변경될 때 Task를 계산합니다.
    useEffect(() => {
        let allTasks = [];
        
        prescriptionsProp.forEach((p) => {
            p.tasks_json.forEach((task, taskIndex) => {
                allTasks.push({
                    ...task,
                    taskIndex: taskIndex, // 배열 내 인덱스
                    prescriptionId: p.id,
                    plantName: p.plantName,
                    userName: p.userName, 
                });
            });
        });

        // 우선순위 정렬: 긴급 > 오늘 > 나머지 > 완료된 것
        allTasks.sort((a, b) => {
            // 1. 완료 상태 체크
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;

            // 2. 긴급 여부 체크
            const aIsUrgent = a.title.includes('[긴급]');
            const bIsUrgent = b.title.includes('[긴급]');
            if (aIsUrgent && !bIsUrgent) return -1;
            if (!aIsUrgent && bIsUrgent) return 1;

            // 3. 오늘 마감 여부 체크
            const today = new Date().toDateString();
            const aIsToday = (a.dueAt && new Date(a.dueAt).toDateString() === today) || !a.dueAt;
            const bIsToday = (b.dueAt && new Date(b.dueAt).toDateString() === today) || !b.dueAt;
            if (aIsToday && !bIsToday) return -1;
            if (!aIsToday && bIsToday) return 1;

            // 4. 날짜순 정렬 (가까운 날짜부터)
            const dateA = a.dueAt ? new Date(a.dueAt).getTime() : Date.now();
            const dateB = b.dueAt ? new Date(b.dueAt).getTime() : Date.now();
            return dateA - dateB;
        });

        setTasks(allTasks);

        // 식물별로 그룹핑
        const groupedByPlant = {};
        allTasks.forEach(task => {
            if (!groupedByPlant[task.plantName]) {
                groupedByPlant[task.plantName] = {
                    tasks: [],
                    prescriptionIds: new Set(), 
                };
            }
            groupedByPlant[task.plantName].tasks.push(task);
            groupedByPlant[task.plantName].prescriptionIds.add(task.prescriptionId);
        });

        // 식물별 그룹을 배열로 변환하고 정렬
        const plantGroupsArray = Object.entries(groupedByPlant).map(([plantName, group]) => {
            const completedCount = group.tasks.filter(t => t.status === 'done').length;
            const totalCount = group.tasks.length;
            const hasUrgent = group.tasks.some(t => t.title.includes('[긴급]') && t.status !== 'done');
            const hasToday = group.tasks.some(t => ((t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString()) || !t.dueAt) && t.status !== 'done');
            const pendingCount = totalCount - completedCount;
            
            return {
                plantName,
                tasks: group.tasks,
                prescriptionIds: Array.from(group.prescriptionIds), 
                completedCount,
                totalCount,
                pendingCount,
                hasUrgent,
                hasToday,
                priority: hasUrgent ? 0 : hasToday ? 1 : 2
            };
        }).sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
            const aProgress = a.completedCount / a.totalCount;
            const bProgress = b.completedCount / b.totalCount;
            return aProgress - bProgress;
        });

        setPlantGroups(plantGroupsArray);

    }, [prescriptionsProp]); 

    // Task 상태 토글 함수: Firestore 업데이트
    const toggleTaskStatus = async (prescriptionId, taskIndex, currentStatus) => {
        if (!db) return;

        try {
            const prescriptionRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);
            
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) throw new Error("처방 문서가 존재하지 않습니다.");
            
            let tasks_json = docSnap.data().tasks_json;
            
            if (tasks_json[taskIndex]) {
                tasks_json[taskIndex].status = currentStatus === 'todo' ? 'done' : 'todo';
                
                await updateDoc(prescriptionRef, { tasks_json: tasks_json });
            }
        } catch (error) {
            console.error('Task 상태 업데이트 실패:', error);
            setModal({ message: `Task 업데이트 중 오류 발생: ${error.message}`, type: 'error' });
        }
    };

    // 개별 Task 삭제 함수
    const deleteTask = async (prescriptionId, taskIndex) => {
        if (!db) return;

        try {
            const prescriptionRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);
            
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) throw new Error("처방 문서가 존재하지 않습니다.");
            
            let tasks_json = docSnap.data().tasks_json;
            
            if (tasks_json.length > taskIndex) {
                tasks_json.splice(taskIndex, 1);
                
                if (tasks_json.length === 0) {
                    await deleteDoc(prescriptionRef);
                    setModal({ message: '모든 Task가 삭제되어 처방이 완전히 삭제되었습니다.', type: 'success' });
                } else {
                    await updateDoc(prescriptionRef, { tasks_json: tasks_json });
                    setModal({ message: 'Task가 삭제되었습니다.', type: 'success' });
                }
            }
        } catch (error) {
            console.error('Task 삭제 실패:', error);
            setModal({ message: `Task 삭제 중 오류 발생: ${error.message}`, type: 'error' });
        }
    };

    // 식물 그룹 토글 함수
    const togglePlantExpansion = (plantName) => {
        const newExpanded = new Set(expandedPlants);
        if (newExpanded.has(plantName)) {
            newExpanded.delete(plantName);
        } else {
            newExpanded.add(plantName);
        }
        setExpandedPlants(newExpanded);
    };
    
    // 전체 처방 스케줄 삭제 함수 (해당 식물의 모든 처방 문서 삭제)
    const deleteAllPrescriptionsForPlant = async (prescriptionIds, plantName) => {
        if (!db) return;

        try {
            await Promise.all(prescriptionIds.map(id => deleteDoc(doc(db, COLLECTIONS.PRESCRIPTIONS, id))));
            setModal({ message: `${plantName}의 모든 처방이 삭제되었습니다.`, type: 'success' });
        } catch (error) {
            console.error('처방 삭제 실패:', error);
            setModal({ message: `처방 삭제 중 오류 발생: ${error.message}`, type: 'error' });
        }
    };
    
    return (
        <div className="space-y-6 p-4 lg:p-6">
            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
            <PageHeader title="처방 스케줄" description={`${familyId ? '가족 그룹의' : '나의'} 식물별 관리 목록입니다. Task를 클릭하여 완료할 수 있습니다.`}/>

            {plantGroups.length === 0 ? (
                <Card>
                    <p className="text-zinc-500 text-center py-4">
                        현재 진행 중인 처방 스케줄이 없습니다. 진단을 시작해 보세요.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {plantGroups.map((plantGroup) => {
                        const isExpanded = expandedPlants.has(plantGroup.plantName);
                        const progressPercentage = Math.round((plantGroup.completedCount / plantGroup.totalCount) * 100);
                        
                        return (
                            <Card key={plantGroup.plantName} className="overflow-hidden">
                                {/* 식물 헤더 */}
                                <div 
                                    className="cursor-pointer p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                    onClick={() => togglePlantExpansion(plantGroup.plantName)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">🌿</div>
                                            <div>
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                                                    {plantGroup.plantName}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                    <span>{plantGroup.completedCount}/{plantGroup.totalCount} 완료</span>
                                                    <div className="w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                                        <div 
                                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${progressPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{progressPercentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* 상태 배지들 */}
                                            {plantGroup.hasUrgent && (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full border border-red-200">
                                                    🚨 긴급
                                                </span>
                                            )}

                                            {/* 전체 처방 삭제 버튼 */}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`${plantGroup.plantName}의 모든 처방을 삭제하시겠습니까?`)) {
                                                        deleteAllPrescriptionsForPlant(plantGroup.prescriptionIds, plantGroup.plantName);
                                                    }
                                                }}
                                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                title="전체 처방 삭제"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            {/* 펼치기/접기 아이콘 */}
                                            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Task 목록 (펼쳐진 경우만) */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-200 dark:border-zinc-700">
                                        <div className="p-4 space-y-3">
                                            {plantGroup.tasks.map((task) => {
                                                const isEmergency = task.title.includes('[긴급]');
                                                const isDone = task.status === 'done';
                                                const isToday = task.dueAt && new Date(task.dueAt).toDateString() === new Date().toDateString();
                                                
                                                return (
                                                    <div 
                                                        key={`${task.prescriptionId}-${task.taskIndex}`}
                                                        className={`cursor-pointer p-3 rounded-lg border transition-all hover:shadow-md
                                                             ${isEmergency && !isDone ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 
                                                               isToday && !isDone ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' :
                                                               isDone ? 'opacity-60 border-zinc-200 dark:border-zinc-700' : 
                                                               'border-zinc-200 dark:border-zinc-700 hover:border-emerald-300'}`}
                                                        onClick={() => toggleTaskStatus(task.prescriptionId, task.taskIndex, task.status)} 
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <h4 className={`font-medium ${isDone ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-50'}`}>
                                                                    {task.title}
                                                                </h4>
                                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                                    조건: {task.condition}
                                                                </p>
                                                                <p className="text-xs text-zinc-500 mt-1">
                                                                    생성자: {task.userName} • 기한: {formatDate(task.dueAt)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-3">
                                                                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap
                                                                     ${isDone ? 'bg-green-100 text-green-800' : 
                                                                       isEmergency ? 'bg-red-100 text-red-800' : 
                                                                       isToday ? 'bg-amber-100 text-amber-800' :
                                                                       'bg-zinc-100 text-zinc-800'}`}>
                                                                    {isDone ? '완료' : isEmergency ? '긴급' : isToday ? '오늘' : '예정'}
                                                                </span>
                                                                {/* 개별 Task 삭제 버튼 */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm(`"${task.title}" Task를 삭제하시겠습니까?`)) {
                                                                            deleteTask(task.prescriptionId, task.taskIndex);
                                                                        }
                                                                    }}
                                                                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                                    title="Task 삭제"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}