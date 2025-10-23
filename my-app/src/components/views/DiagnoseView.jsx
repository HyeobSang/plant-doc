// src/components/views/DiagnoseView.jsx

import React, { useState } from 'react';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

import { db, COLLECTIONS } from '../../api/firebase';
import { Card, PageHeader, MessageModal } from '../common/Card';
import { Icon } from '../common/Icons';
import { getSeverityColor, getSeverityIcon } from '../../utils/helpers';

export default function DiagnoseView({ currentUser, onDiagnosisComplete }) {
    const [files, setFiles] = useState([]); 
    const [result, setResult] = useState(null); 
    const [loading, setLoading] = useState(false); 
    const [plantName, setPlantName] = useState(''); 
    const [modal, setModal] = useState({ message: '', type: '' });
    const [step, setStep] = useState(1); // 1: Image Upload, 2: Result

    // 실제 Flask 백엔드 API 호출 (로컬 환경에서 실행되는 것으로 가정)
    const diagnosePlant = async (imageFile, plantName) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('plantName', plantName);

            // Flask API 호출
            const response = await fetch('/.netlify/functions/diagnose', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Flask에서 받은 결과를 프론트엔드 형식에 맞게 변환
            return {
                status: result.status,
                severityLevel: result.severity_level,
                severityRatio: result.severity_ratio,
                issues: result.issues.map(issue => ({
                    label: issue.label,
                    confidence: issue.confidence,
                    code: issue.label.includes('Powdery Mildew') ? 'PM' : 'SLS'
                })),
                prescriptionText: result.prescription_text,
                annotatedImage: `data:image/jpeg;base64,${result.annotated_image}`
            };
        } catch (error) {
            console.error('진단 API 호출 오류:', error);
            throw new Error(`진단 서버 연결 실패: ${error.message}`);
        }
    };

    // 처방 Task 생성 로직 (실제 YOLO 결과 기반)
    const generatePrescriptionTasks = (diagResult) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const severity = diagResult.severityLevel;
        const mainIssue = diagResult.issues[0]?.label || 'Unknown';
        let tasks = [];

        // --- 심각도와 질병에 따른 규칙 기반 처방 로직 ---
        if (mainIssue.includes('Powdery Mildew')) {
            if (severity === 'Severe') {
                tasks.push({ id: 't1-' + id, title: '[긴급] 감염 잎 즉시 제거', condition: '소독된 가위 사용', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '전체 식물 베이킹소다수 살포', condition: '잎 뒷면까지 처리', status: 'todo' });
                tasks.push({ id: 't3-' + id, title: '72시간 후 상태 재점검', dueAt: new Date(now + 72 * 3600e3).toISOString(), status: 'todo' });
            } else if (severity === 'Moderate') {
                tasks.push({ id: 't1-' + id, title: '오일 기반 살균제(님 오일 등) 살포', condition: '잎 앞뒤에 처리', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '주변 환기 상태 개선', condition: '공기 순환 시작', status: 'todo' });
                tasks.push({ id: 't3-' + id, title: '4일 후 상태 재점검', condition: '같은 부위 사진 촬영 후 재진단', dueAt: new Date(now + 4 * 24 * 3600e3).toISOString(), status: 'todo' });
            } else if (severity === 'Mild') {
                tasks.push({ id: 't1-' + id, title: '예방적 베이킹소다수 살포', condition: '주 1회', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '환기 개선 및 습도 조절', condition: '지속적 관리', status: 'todo' });
            }
        } else if (mainIssue.includes('Septoria_leaf_spot')) { 
            if (severity === 'Severe') {
                tasks.push({ id: 't1-' + id, title: '[긴급] 관수 중단 및 흙 건조', condition: '흙 상태 확인 후', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '감염된 흙 및 뿌리 부분 교체', condition: '새 흙으로 분갈이', status: 'todo' });
                tasks.push({ id: 't3-' + id, title: '수돗물 대신 저면 관수 시작', condition: '잎에 물 닿지 않도록', status: 'todo' });
                tasks.push({ id: 't4-' + id, title: '1주 후 상태 재평가', dueAt: new Date(now + 7 * 24 * 3600e3).toISOString(), status: 'todo' });
            } else if (severity === 'Moderate') {
                tasks.push({ id: 't1-' + id, title: '감염 부위 격리 제거', condition: '반점 잎만 절단', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '동제(銅劑) 기반 살균제 처리', condition: '반점 부위에 집중 살포', status: 'todo' });
                tasks.push({ id: 't3-' + id, title: '주변 식물 격리 조치', condition: '확산 방지', status: 'todo' });
            } else if (severity === 'Mild') {
                tasks.push({ id: 't1-' + id, title: '감염 잎 제거', condition: '소독된 도구 사용', status: 'todo' });
                tasks.push({ id: 't2-' + id, title: '저면 관수로 전환', condition: '잎에 물 닿지 않도록', status: 'todo' });
            }
        } else if (severity === 'Healthy') {
            tasks.push({ id: 't1-' + id, title: '정기 점검 스케줄 추가', condition: '1주일 후', status: 'todo', dueAt: new Date(now + 7 * 24 * 3600e3).toISOString() });
        }
        
        if (tasks.length === 0) {
            tasks.push({ id: 't1-' + id, title: '정기 점검 스케줄 추가', condition: '1주일 후', status: 'todo', dueAt: new Date(now + 7 * 24 * 3600e3).toISOString() });
        }
        return tasks;
    };

    const handleAnalyze = async () => {
        if (!files.length) return setModal({ message: '식물 사진을 선택해 주세요.', type: 'error' });
        if (!db) return setModal({ message: '데이터베이스 연결 오류: Firebase가 초기화되지 않았습니다.', type: 'error' });

        setLoading(true);
        setResult(null);
        
        try { 
            // 1. 실제 AI 진단 (Flask API 호출)
            const diagnosisResult = await diagnosePlant(files[0], plantName);
            
            // 2. 처방 Task 생성
            const tasks = generatePrescriptionTasks(diagnosisResult);

            // 3. Firestore에 진단 결과 저장
            const diagRef = doc(collection(db, COLLECTIONS.DIAGNOSES));
            const diagnosisId = diagRef.id;

            const diagnosisData = {
                diagnosisId: diagnosisId,
                userId: currentUser.uid,
                userName: currentUser.name,
                familyId: currentUser.familyId || null, // 가족 공유를 위해 필수
                plantName: plantName || 'Unknown Plant',
                severityLevel: diagnosisResult.severityLevel,
                severityRatio: diagnosisResult.severityRatio,
                issues: diagnosisResult.issues,
                prescriptionText: diagnosisResult.prescriptionText,
                annotatedImage: diagnosisResult.annotatedImage,
                createdAt: new Date().toISOString()
            };
            await setDoc(diagRef, diagnosisData);
            
            // 4. 처방 Task 저장
            await addDoc(collection(db, COLLECTIONS.PRESCRIPTIONS), {
                userId: currentUser.uid,
                familyId: currentUser.familyId || null,
                diagnosisId: diagnosisId,
                plantName: plantName || 'Unknown Plant',
                tasks_json: tasks,
                status: 'active',
                createdAt: new Date().toISOString()
            });

            setResult(diagnosisResult);
            onDiagnosisComplete(diagnosisData); // App 컴포넌트에 알림
            setStep(2); // 결과 단계로 전환
            
        } catch (error) {
            console.error("진단 오류:", error);
            setModal({ message: `진단 실패: ${error.message}`, type: 'error' });
            setResult(null);
        }
        finally { 
            setLoading(false); 
        }
    };
    
    // UI 렌더링
    return (
        <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-6">
            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
            <PageHeader title="AI 진단 시작" description="식물의 잎이나 줄기의 병변을 촬영하여 업로드해주세요."/>
            
            {step === 1 && (
                <Card className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-2">1. 진단 정보 입력</h2>
                    
                    {/* 식물 이름 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            식물 이름 (필수)
                        </label>
                        <input
                            type="text"
                            value={plantName}
                            onChange={(e) => setPlantName(e.target.value)}
                            required
                            placeholder="예: 몬스테라, 고무나무"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    
                    {/* 이미지 업로드 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            식물 사진 업로드 (병변 부위)
                        </label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e=>setFiles(e.target.files)}
                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
                        />
                        {files.length > 0 && <p className="mt-2 text-xs text-zinc-500">{files[0].name} ({Math.round(files[0].size / 1024)} KB) 선택됨</p>}
                    </div>

                    {/* 분석 버튼 */}
                    <button
                        className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        onClick={handleAnalyze}
                        disabled={loading || !files.length || !plantName.trim() || !db}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                {Icon.loading("w-5 h-5 mr-3")} AI 분석 중...
                            </div>
                        ) : 'AI 진단 및 처방 받기'}
                    </button>
                </Card>
            )}

            {step === 2 && result && (
                <Card className="space-y-6">
                    {/* 진단 완료 헤더 */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
                            <span className="text-2xl">🌿</span>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-600 mb-2">진단 완료!</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">{plantName}의 상태를 분석했습니다</p>
                    </div>
                    
                    {/* 진단 결과 이미지 */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <img 
                                src={result.annotatedImage} 
                                alt="AI 진단 결과 이미지" 
                                className="w-full max-w-md h-auto rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700" 
                            />
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded-lg text-xs font-medium">
                                AI 분석 결과
                            </div>
                        </div>
                    </div>
                    
                    {/* 진단 요약 카드 */}
                    <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <span className="text-2xl">🔍</span>
                            진단 요약
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-700 rounded-lg">
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">감지된 문제:</span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {result.issues[0]?.label || '건강한 상태'}
                                    </span>
                                </div>
                                {result.issues[0] && (
                                    <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-700 rounded-lg">
                                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">AI 확신도:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {(result.issues[0]?.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-700 rounded-lg">
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">심각도:</span>
                                    <span className={`font-bold text-lg ${getSeverityColor(result.severityLevel)}`}>
                                        {getSeverityIcon(result.severityLevel)} {result.severityLevel === 'Healthy' ? '건강' : result.severityLevel}
                                        {result.severityLevel !== 'Healthy' && ` (${result.severityRatio}%)`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 맞춤형 처방 카드 */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                        <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                            <span className="text-2xl">💊</span>
                            맞춤형 처방
                        </h3>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {result.prescriptionText}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        <button
                            className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
                            onClick={() => { setStep(1); setResult(null); setFiles([]); setPlantName(''); }}
                        >
                            🔄 새 진단 시작
                        </button>
                        <a 
                            href="#/schedule"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors text-lg shadow-lg hover:shadow-xl"
                        >
                            📅 처방 스케줄 확인하기
                        </a>
                    </div>
                </Card>
            )}
        </div>
    );
}