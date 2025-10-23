// src/components/auth/AuthView.jsx

import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    doc, setDoc, updateDoc, collection, query, where, getDocs 
} from 'firebase/firestore';

import { db, auth, COLLECTIONS } from '../../api/firebase';
import { Card, MessageModal } from '../common/Card';
import { Icon } from '../common/Icons';
import { generateInviteCode } from '../../utils/helpers';

export default function AuthView({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modal, setModal] = useState({ message: '', type: '' });

    // 가족 그룹을 찾거나 생성하고, 사용자 프로필에 familyId를 업데이트
    const handleFamilyAction = async (userId, familyName, inviteCode) => {
        if (!db) return null;

        let familyId = null;

        if (familyName) {
            // 1. 새 가족 생성
            const newFamilyRef = doc(collection(db, COLLECTIONS.FAMILIES));
            familyId = newFamilyRef.id;
            const newInviteCode = generateInviteCode();
            
            await setDoc(newFamilyRef, {
                id: familyId,
                name: familyName,
                inviteCode: newInviteCode,
                createdBy: userId,
                createdAt: new Date().toISOString()
            });
            setModal({ message: `가족 그룹 '${familyName}'이 생성되었습니다. 초대 코드: ${newInviteCode}`, type: 'success' });
            
        } else if (inviteCode) {
            // 2. 기존 가족 참여
            const q = query(collection(db, COLLECTIONS.FAMILIES), where("inviteCode", "==", inviteCode.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("유효하지 않은 초대 코드입니다.");
            }

            familyId = querySnapshot.docs[0].id;
        }

        // 3. 사용자 프로필 업데이트 (가족 ID 저장)
        if (familyId) {
            // Private Profile Update
            await setDoc(doc(db, COLLECTIONS.PROFILES(userId), 'user_profile'), 
                { familyId: familyId }, 
                { merge: true }
            );
            // Public Users_ALL Update (Crucial for Family Member loading)
            await updateDoc(doc(db, COLLECTIONS.USERS_ALL, userId), { familyId: familyId });
        }

        return familyId;
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!auth || !db) throw new Error("데이터베이스 연결 오류가 발생했습니다.");

            if (!isLogin) { // 회원가입
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // 1. 사용자 프로필 데이터 생성
                const userProfileData = {
                    userId: user.uid,
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString(),
                };
                
                // 2. 개인 프로필 저장 (Private)
                await setDoc(doc(db, COLLECTIONS.PROFILES(user.uid), 'user_profile'), userProfileData);
                
                // 3. PUBLIC users_all 경로에 복사 (가족들이 조회할 수 있도록 함)
                await setDoc(doc(db, COLLECTIONS.USERS_ALL, user.uid), userProfileData);

                // 4. 가족 그룹 처리 (선택 사항)
                await handleFamilyAction(user.uid, familyName, inviteCode);
                
                onAuthSuccess(user.uid);
                setModal({ message: '회원가입 및 로그인 완료!', type: 'success' });

            } else { // 로그인
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                onAuthSuccess(userCredential.user.uid);
            }
        } catch (err) {
            let displayError = '알 수 없는 오류가 발생했습니다.';
            if (err.code) {
                switch (err.code) {
                    case 'auth/email-already-in-use':
                        displayError = '이미 등록된 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.';
                        break;
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        displayError = '이메일 또는 비밀번호가 잘못되었습니다.';
                        break;
                    case 'auth/weak-password':
                        displayError = '비밀번호는 6자리 이상이어야 합니다.';
                        break;
                    default:
                        displayError = err.message || err.code;
                }
            } else {
                displayError = err.message;
            }
            setError(displayError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 font-inter">
            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                        {Icon.logo("w-8 h-8 text-white")}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Plant Doctor</h1>
                    <p className="text-gray-600 dark:text-gray-400">AI로 식물을 진단하고 가족과 공유하세요</p>
                </div>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                        {isLogin ? '로그인' : '회원가입'}
                    </h2>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
                            <div className="flex items-center">
                                <span className="mr-2">❌</span> {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {/* 이메일 */}
                        <label className="block space-y-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">이메일</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                            />
                        </label>

                        {/* 비밀번호 */}
                        <label className="block space-y-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">비밀번호</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                            />
                        </label>

                        {!isLogin && (
                            <>
                                {/* 이름 */}
                                <label className="block space-y-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">이름</span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                    />
                                </label>
                                
                                {/* 가족 그룹명 (새로 만들기) */}
                                <label className="block space-y-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">가족 그룹명 (새로 만들기)</span>
                                    <input
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => {setFamilyName(e.target.value); setInviteCode('');}}
                                        placeholder="예: 김씨 가족"
                                        disabled={!!inviteCode}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                                    />
                                </label>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-600" /></div>
                                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">또는</span></div>
                                </div>

                                {/* 초대 코드 (기존 가족에 참여) */}
                                <label className="block space-y-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">초대 코드 (기존 가족에 참여)</span>
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => {setInviteCode(e.target.value.toUpperCase()); setFamilyName('');}}
                                        placeholder="예: ABC123"
                                        disabled={!!familyName}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 font-mono text-center disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                                    />
                                </label>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !auth}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    {Icon.loading("w-5 h-5 mr-3")} 처리 중...
                                </div>
                            ) : (
                                isLogin ? '로그인' : '회원가입'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                            {isLogin ? '회원가입하기' : '로그인하기'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}