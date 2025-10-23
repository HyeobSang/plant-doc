// src/components/views/MyDiagnosesView.jsx

import React, { useState } from 'react';
import { Card, PageHeader, MessageModal } from '../common/Card';
import { getSeverityColor, getSeverityIcon, formatDate, formatFullDate } from '../../utils/helpers';

export default function MyDiagnosesView({ currentUser, diagnoses }) {
    const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
    const [modal, setModal] = useState({ message: '', type: '' });
    
    // 현재 사용자의 진단 기록만 필터링
    const myDiagnoses = diagnoses.filter(d => d.userId === currentUser.uid);
    
    // 진단 기록을 날짜순으로 정렬 (최신순)
    const sortedDiagnoses = myDiagnoses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    
    return (
        <div className="space-y-6 p-4 lg:p-6">
            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
            <PageHeader 
                title="나의 진단 기록" 
                description={`총 ${sortedDiagnoses.length}건의 진단 기록이 있습니다.`}
            />
            
            {sortedDiagnoses.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🌱</div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">아직 진단 기록이 없습니다</h3>
                        <p className="text-zinc-500 mb-6">첫 번째 식물 진단을 시작해보세요!</p>
                        <a 
                            href="#/diagnose"
                            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            🩺 진단 시작하기
                        </a>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedDiagnoses.map((diagnosis) => (
                        <Card 
                            key={diagnosis.diagnosisId} 
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                            onClick={() => setSelectedDiagnosis(diagnosis)}
                        >
                            <div className="space-y-4">
                                {/* 식물 이미지와 상태 */}
                                <div className="relative">
                                    <img 
                                        src={diagnosis.annotatedImage} 
                                        alt={`${diagnosis.plantName} 진단 결과`}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(diagnosis.severityLevel)}`}>
                                            {getSeverityIcon(diagnosis.severityLevel)} {diagnosis.severityLevel === 'Healthy' ? '건강' : diagnosis.severityLevel}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* 진단 정보 */}
                                <div className="space-y-2">
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                                        {diagnosis.plantName}
                                    </h3>
                                    
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">감지된 문제:</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {diagnosis.issues[0]?.label || '건강한 상태'}
                                            </span>
                                        </div>
                                        {diagnosis.issues[0] && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">AI 확신도:</span>
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                    {(diagnosis.issues[0]?.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">진단일:</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {formatDate(diagnosis.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 클릭 안내 */}
                                <div className="text-center">
                                    <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                                        클릭하여 자세히 보기
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* 진단 상세 모달 */}
            {selectedDiagnosis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDiagnosis(null)}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 space-y-6">
                            {/* 모달 헤더 */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                        {selectedDiagnosis.plantName} 진단 결과
                                    </h2>
                                    <p className="text-zinc-500 text-sm">
                                        {formatFullDate(selectedDiagnosis.createdAt)}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedDiagnosis(null)}
                                    className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* 진단 이미지 */}
                            <div className="flex justify-center">
                                <img 
                                    src={selectedDiagnosis.annotatedImage} 
                                    alt="진단 결과 이미지"
                                    className="w-full max-w-md h-auto rounded-lg shadow-md"
                                />
                            </div>
                            
                            {/* 진단 상세 정보 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">진단 요약</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">감지된 문제:</span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                                {selectedDiagnosis.issues[0]?.label || '건강한 상태'}
                                            </span>
                                        </div>
                                        {selectedDiagnosis.issues[0] && (
                                            <div className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">AI 확신도:</span>
                                                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                                                    {(selectedDiagnosis.issues[0]?.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">심각도:</span>
                                            <span className={`font-bold ${getSeverityColor(selectedDiagnosis.severityLevel)}`}>
                                                {getSeverityIcon(selectedDiagnosis.severityLevel)} {selectedDiagnosis.severityLevel === 'Healthy' ? '건강' : selectedDiagnosis.severityLevel}
                                                {selectedDiagnosis.severityLevel !== 'Healthy' && ` (${selectedDiagnosis.severityRatio}%)`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">맞춤형 처방</h3>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                            {selectedDiagnosis.prescriptionText}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}