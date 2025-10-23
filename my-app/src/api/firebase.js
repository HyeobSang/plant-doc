// src/api/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 전역 변수 설정 (Canvas 환경에서 제공됨)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyADy-LF_rmt2hNUywQfrlpYI2KzY7mYvmk",
    authDomain: "plant-doctor-b3819.firebaseapp.com",
    projectId: "plant-doctor-b3819",
    storageBucket: "plant-doctor-b3819.firebasestorage.app",
    messagingSenderId: "815891328829",
    appId: "1:815891328829:web:3a6ad7ca0416100d059f54"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db, auth;
if (Object.keys(firebaseConfig).length > 0) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        // setLogLevel('debug'); // For debugging
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    console.warn("Firebase configuration not provided. Data persistence is disabled.");
}

// Firestore 경로 정의
const COLLECTIONS = {
    // 공용 데이터 (가족 그룹 정보)
    FAMILIES: `artifacts/${appId}/public/data/families`, 
    // 사용자별 프로필 (다른 사용자와 공유할 필요 없는 정보)
    PROFILES: (userId) => `artifacts/${appId}/users/${userId}/profiles`,
    // 진단 이력 (가족 공유)
    DIAGNOSES: `artifacts/${appId}/public/data/diagnoses`,
    // 처방 스케줄 (가족 공유)
    PRESCRIPTIONS: `artifacts/${appId}/public/data/prescriptions`,
    // 가족 멤버 목록 조회를 위한 공용 프로필 경로
    USERS_ALL: `artifacts/${appId}/users`, 
};

export { db, auth, COLLECTIONS, initialAuthToken };