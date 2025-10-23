// src/components/views/FamilyView.jsx

import React, { useState, useEffect } from 'react';
import { collection, doc, updateDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

import { db, COLLECTIONS } from '../../api/firebase';
import { Card, PageHeader, MessageModal } from '../common/Card';
import { Icon } from '../common/Icons';
import { getSeverityColor } from '../../utils/helpers';
import { generateInviteCode } from '../../utils/helpers'; // generateInviteCode도 helpers에서 가져옵니다.

export default function FamilyView({ currentUser, familyId, familyInfo, familyMembers, diagnoses: diagnosesProp }) {
    const [loading, setLoading] = useState(false);
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [familyNameInput, setFamilyNameInput] = useState('');
    const [modal, setModal] = useState({ message: '', type: '' });
    const [diagnoses, setDiagnoses] = useState([]); // prop을 저장할 로컬 상태

    useEffect(() => {
        // App에서 전달된 props.diagnoses를 사용하여 로컬 상태를 설정합니다.
        if (diagnosesProp && diagnosesProp.length > 0) {
            setDiagnoses(diagnosesProp.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } else {
             setDiagnoses([]);
        }
    }, [diagnosesProp]); 

    // 가족 그룹 생성
    const handleCreateFamily = async () => {
        if (!familyNameInput.trim()) return setModal({ message: '가족 그룹 이름을 입력해주세요.', type: 'error' });
        if (!db) return;

        setLoading(true);
        try {
            const newFamilyRef = doc(collection(db, COLLECTIONS.FAMILIES));
            const familyRefId = newFamilyRef.id;
            const newInviteCode = generateInviteCode();

            const batch = writeBatch(db);
            
            // 1. 가족 문서 생성
            batch.set(newFamilyRef, {
                id: familyRefId,
                name: familyNameInput,
                inviteCode: newInviteCode,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            });

            // 2. 사용자 프로필에 familyId 업데이트 (Private)
            const userProfileRef = doc(db, COLLECTIONS.PROFILES(currentUser.uid), 'user_profile');
            batch.update(userProfileRef, { familyId: familyRefId });
            
            // 3. 사용자 프로필에 familyId 업데이트 (Public - USERS_ALL)
            const userAllRef = doc(db, COLLECTIONS.USERS_ALL, currentUser.uid);
            batch.update(userAllRef, { familyId: familyRefId });

            await batch.commit();

            setModal({ message: `'${familyNameInput}' 그룹 생성 완료! 초대 코드: ${newInviteCode}`, type: 'success' });
            setFamilyNameInput(''); // 입력 필드 초기화
        } catch (error) {
            console.error('가족 생성 오류:', error);
            setModal({ message: `가족 그룹 생성 실패: ${error.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 가족 그룹 참여
    const handleJoinFamily = async () => {
        if (!inviteCodeInput.trim()) return setModal({ message: '초대 코드를 입력해주세요.', type: 'error' });
        if (!db) return;

        setLoading(true);
        try {
            const inviteCode = inviteCodeInput.toUpperCase();
            
            // 1. 초대 코드로 가족 문서 조회
            const q = query(collection(db, COLLECTIONS.FAMILIES), where("inviteCode", "==", inviteCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("유효하지 않거나 만료된 초대 코드입니다.");
            }

            const familyIdToJoin = querySnapshot.docs[0].id;

            // 2. 사용자 프로필에 familyId 업데이트 (Private)
            const userProfileRef = doc(db, COLLECTIONS.PROFILES(currentUser.uid), 'user_profile');
            await updateDoc(userProfileRef, { familyId: familyIdToJoin });

            // 3. 사용자 프로필에 familyId 업데이트 (Public - USERS_ALL)
            const userAllRef = doc(db, COLLECTIONS.USERS_ALL, currentUser.uid);
            await updateDoc(userAllRef, { familyId: familyIdToJoin });

            setModal({ message: '가족 그룹에 성공적으로 참여했습니다!', type: 'success' });
            setInviteCodeInput(''); // 입력 필드 초기화
        } catch (error) {
            console.error('가족 참여 오류:', error);
            setModal({ message: `가족 참여 실패: ${error.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    // 초대 코드 복사
    const copyInviteCode = () => {
        navigator.clipboard.writeText(familyInfo.inviteCode).then(() => {
            setModal({ message: '초대 코드가 클립보드에 복사되었습니다!', type: 'success' });
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            setModal({ message: '클립보드 복사 중 오류가 발생했습니다.', type: 'error' });
        });
    };

    if (!familyId) {
        return (
            <div className="max-w-xl mx-auto p-4 lg:p-6 space-y-6">
                <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
                <PageHeader title="가족 그룹 설정" description="식물 관리 스케줄을 공유하고 함께 관리하세요."/>
                
                <Card className="space-y-6">
                    <h2 className="text-xl font-bold text-emerald-600 mb-4">가족 그룹이 없습니다.</h2>
                    
                    {/* 그룹 생성 */}
                    <div className="border-b border-zinc-200 dark:border-zinc-700 pb-4 space-y-3">
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">1. 새로운 가족 그룹 생성</h3>
                        <label className="block space-y-1">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">그룹명</span>
                            <input
                                type="text"
                                value={familyNameInput}
                                onChange={(e) => setFamilyNameInput(e.target.value)}
                                placeholder="예: 김씨 가족 또는 반려 식물 방"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                            />
                        </label>
                        <button
                            onClick={handleCreateFamily}
                            disabled={loading || !familyNameInput.trim()}
                            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '생성 중...' : '그룹 생성'}
                        </button>
                    </div>

                    {/* 그룹 참여 */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">2. 초대 코드로 참여</h3>
                        <label className="block space-y-1">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">초대 코드</span>
                            <input
                                type="text"
                                value={inviteCodeInput}
                                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 dark:bg-gray-800 dark:text-white font-mono text-center tracking-widest"
                            />
                        </label>
                        <button
                            onClick={handleJoinFamily}
                            disabled={loading || inviteCodeInput.length !== 6}
                            className="w-full py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? '참여 중...' : '그룹 참여'}
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    // --- 가족 그룹이 있을 경우 UI ---
    return (
        <div className="max-w-xl mx-auto p-4 lg:p-6 space-y-6">
            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
            <PageHeader title="가족 공유 센터" description={`${familyInfo?.name || '가족 그룹'} 관리 및 이력 공유`}/>
            
            <Card className="space-y-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700">
                <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                    그룹 정보 ({familyInfo?.name})
                </h3>
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">초대 코드:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-lg text-emerald-800 dark:text-emerald-300 tracking-widest">
                            {familyInfo?.inviteCode}
                        </span>
                        <button onClick={copyInviteCode} className="p-1 rounded-md text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-800/50">
                            {Icon.copy("w-4 h-4")}
                        </button>
                    </div>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">생성자:</span> {familyMembers.find(m => m.userId === familyInfo?.createdBy)?.name || '알 수 없음'}
                </div>
            </Card>

            <Card className="space-y-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">가족 멤버 ({familyMembers.length}명)</h3>
                <ul className="space-y-2">
                    {familyMembers.map((member) => (
                        <li key={member.userId} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-700 rounded-full flex items-center justify-center font-semibold text-emerald-700 dark:text-emerald-200">
                                {member.name.charAt(0)}
                            </div>
                            <span>{member.name}</span>
                            <span className="text-zinc-500 text-xs ml-auto">{member.email}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card className="space-y-3">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">가족 진단 이력 ({diagnoses.length}건)</h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                    {diagnoses.slice(0, 5).map(d => (
                        <li key={d.diagnosisId} className="p-3 border border-zinc-100 dark:border-zinc-700 rounded-lg">
                            <div className="flex justify-between items-start text-sm">
                                <div>
                                    <span className="font-medium">{d.plantName}</span> ({d.userName})
                                </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(d.severityLevel)}`}>
                            {d.severityLevel === 'Healthy' ? '건강' : d.severityLevel}
                        </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                {d.issues[0]?.label || '미확인 문제'} • {new Date(d.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                        </li>
                    ))}
                </ul>
                {diagnoses.length === 0 && <p className="text-zinc-500 text-sm text-center py-2">가족 그룹에 아직 진단 기록이 없습니다.</p>}
            </Card>
        </div>
    );
}