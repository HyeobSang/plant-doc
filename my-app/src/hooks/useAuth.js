// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { 
    signInWithCustomToken, 
    onAuthStateChanged,
    signOut,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { db, auth, COLLECTIONS, initialAuthToken } from '../api/firebase';

export default function useAuth() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. 프로필 및 가족 정보 로드 (familyId를 찾습니다)
    const loadUserProfile = useCallback((userId) => {
        if (!db || !auth.currentUser) {
            setLoading(false);
            return () => {};
        }
        
        const profileRef = doc(db, COLLECTIONS.PROFILES(userId), 'user_profile');

        const unsubscribe = onSnapshot(profileRef, async (profileSnap) => {
            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                const newCurrentUser = { 
                    uid: userId, 
                    email: auth.currentUser.email || '익명 사용자', 
                    ...profile,
                    familyId: profile.familyId || null,
                    name: profile.name || auth.currentUser.email?.split('@')[0] || '익명 사용자'
                };
                setCurrentUser(newCurrentUser);
            } else {
                // 프로필 문서가 없으면, 최소한의 정보만으로 유저를 설정
                setCurrentUser({ 
                    uid: userId, 
                    email: auth.currentUser.email || '익명 사용자', 
                    name: auth.currentUser.email?.split('@')[0] || '익명 사용자', 
                    familyId: null 
                });
            }
            setLoading(false);
        }, (error) => {
             console.error("Profile subscription failed:", error);
             setLoading(false);
        });
        
        return unsubscribe;
    }, []);

    // 1. 초기 인증 및 사용자 프로필 로드 (AuthListener)
    const checkUser = useCallback(() => {
        if (!auth || !db) {
            setLoading(false);
            return () => {};
        }

        const handleAuthChange = (user) => {
            if (user) {
                // 사용자 ID로 프로필 로드 시작
                loadUserProfile(user.uid);
            } else {
                // 인증 안됨: 초기 토큰으로 시도 (Canvas 환경을 위한 설정)
                if (initialAuthToken) {
                    signInWithCustomToken(auth, initialAuthToken).catch(console.error);
                }
                setCurrentUser(null);
                setLoading(false);
            }
        };
        
        const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
        return unsubscribe;
    }, [loadUserProfile]); // loadUserProfile을 의존성으로 추가

    // Auth 리스너 실행
    useEffect(() => {
        const unsubscribe = checkUser();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [checkUser]);

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
            // signOut 후 onAuthStateChanged가 호출되어 currentUser는 자동으로 null로 설정됨
        }
    };
    
    // AuthView에서 성공 시 호출되어 loadUserProfile을 트리거
    const handleAuthSuccess = (userId) => {
        setLoading(true); // 로딩 재설정
        loadUserProfile(userId);
    };

    return { 
        currentUser, 
        authLoading: loading, 
        handleSignOut, 
        handleAuthSuccess 
    };
}