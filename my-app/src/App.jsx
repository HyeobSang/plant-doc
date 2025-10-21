import React, { useState, useEffect, useCallback } from 'react';

import { initializeApp } from 'firebase/app';

import { 

    getAuth, 

    signInWithCustomToken, 

    onAuthStateChanged,

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    signOut

} from 'firebase/auth';

import { 

    getFirestore, 

    doc, 

    setDoc, 

    onSnapshot, 

    collection, 

    query, 

    where, 

    addDoc, 

    updateDoc, 

    getDocs,

    getDoc,

    writeBatch,

    deleteDoc

} from 'firebase/firestore';



// ====================================================================

// 1. FIREBASE & APP SETUP

// ====================================================================



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



// ====================================================================

// 2. ICONS & NAV (Tailwind Icons)

// ====================================================================



const Icon = {

    logo: (className = "w-6 h-6") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2c-2 4-5 6-9 6 2 3 5 4 9 4s7-1 9-4c-4 0-7-2-9-6Zm-1 11.1C9.2 16.1 6.8 18 3 18c2.5 3 5.3 4 8.9 4 3.7 0 6.6-1 9.1-4-3.9 0-6.3-1.9-8-4.9l-.9 0Z"/></svg>),

    dashboard: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h5v8H3v-8Zm7 0h11v8H10v-8Z"/></svg>),

    diagnose: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V2Zm1 3h-2v4H7v2h4v4h2v-4h4V9h-4V5Z"/></svg>),

    schedule: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M7 2v2H4a2 2 0 0 0-2 2v2h20V6a2 2 0 0 0-2-2h-3V2h-2v2H9V2H7Zm15 8H2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10Zm-9 3h2v5h-2v-5Z"/></svg>),

    kb: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M4 3h11a4 4 0 0 1 4 4v12.5a.5.5 0 0 1-.8.4L15 17H6a2 2 0 0 1-2-2V3Zm2 2v10h8.5l2.5 1.9V7a2 2 0 0 0-2-2H6Z"/></svg>),

    family: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2a6 6 0 0 0-6 6c0 2.8 1.9 5.2 4.5 5.8l-.2 5.2a1 1 0 0 0 2 0l-.2-5.2C14.1 13.2 16 10.8 16 8a6 6 0 0 0-6-6Zm0 2a4 4 0 0 1 4 4c0 1.9-1.2 3.6-3 4.4v1.6a1 1 0 0 0 2 0v-.5l2.2-.4a4 4 0 0 1 1.6 3.4c0 3.3-2.9 6-6.8 6-3.8 0-6.8-2.7-6.8-6a4 4 0 0 1 1.6-3.4l2.2.4v.5a1 1 0 0 0 2 0v-1.6C8.2 11.6 7 9.9 7 8a4 4 0 0 1 4-4Z"/></svg>),

    settings: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.9 2.6 2.1 1.2-2 3.6-2.3-.5a7.98 7.98 0 0 1-1.7 1l-.5 2.4H9.5l-.5-2.4a7.98 7.98 0 0 1-1.7-1l-2.3.5-2-3.6 2.1-1.2a7.5 7.5 0 0 1 0-1.2L.99 8.2l2-3.6 2.3.5c.5-.4 1-.7 1.6-.9l.5-2.4h6.1l.5 2.4c.6.2 1.1.5 1.6.9l2.3-.5 2 3.6-2.1 1.2c.1.4.1.8 0 1.2Z"/></svg>),

    menu: (className = "w-6 h-6") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/></svg>),

    loading: (className = "w-5 h-5") => (<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>),

    plus: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M11 13h-4v-2h4v-4h2v4h4v2h-4v4h-2v-4Z"/></svg>),

    copy: (className = "w-5 h-5") => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>)

};



const NAV_ITEMS = [

    { label: "대시보드", key: "dashboard", icon: Icon.dashboard(), href: "#/dashboard" },

    { label: "진단 시작", key: "diagnose", icon: Icon.diagnose(), href: "#/diagnose" },

    { label: "나의 진단 기록", key: "my-diagnoses", icon: Icon.diagnose(), href: "#/my-diagnoses" },

    { label: "처방 스케줄", key: "schedule", icon: Icon.schedule(), href: "#/schedule" },

    { label: "가족 공유", key: "family", icon: Icon.family(), href: "#/family" },

    { label: "지식 기반", key: "kb", icon: Icon.kb(), href: "#/kb" },

    { label: "설정", key: "settings", icon: Icon.settings(), href: "#/settings" }

];



// ====================================================================

// 3. COMMON COMPONENTS (Card, PageHeader, Modal, ErrorBoundary)

// ====================================================================

// Error Boundary Component

class ErrorBoundary extends React.Component {

    constructor(props) {

        super(props);

        this.state = { hasError: false, error: null };

    }

    

    static getDerivedStateFromError(error) {

        return { hasError: true, error };

    }

    

    componentDidCatch(error, errorInfo) {

        console.error('ErrorBoundary caught an error:', error, errorInfo);

    }

    

    render() {

        if (this.state.hasError) {

            return (

                <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">

                    <Card className="max-w-md w-full text-center">

                        <div className="text-red-500 text-6xl mb-4">⚠️</div>

                        <h2 className="text-xl font-bold text-red-600 mb-2">오류가 발생했습니다</h2>

                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">

                            예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.

                        </p>

                        <button 

                            onClick={() => window.location.reload()} 

                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"

                        >

                            새로고침

                        </button>

                    </Card>

                </div>

            );

        }

        

        return this.props.children;

    }

}



const Card = ({ children, className = '', ...props }) => (

    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm ${className}`} {...props}>

        {children}

    </div>

);



const PageHeader = ({ title, description, actions }) => (

    <div className="flex items-start gap-3 justify-between flex-wrap">

        <div>

            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>

            {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}

        </div>

        {actions && <div className="flex gap-2 mt-1 sm:mt-0">{actions}</div>}

    </div>

);



const MessageModal = ({ message, type, onClose }) => {

    if (!message) return null;



    let bgColor, textColor, borderColor;

    switch (type) {

        case 'error':

            bgColor = 'bg-red-50 dark:bg-red-900/20';

            textColor = 'text-red-700 dark:text-red-300';

            borderColor = 'border-red-200 dark:border-red-800';

            break;

        case 'success':

            bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';

            textColor = 'text-emerald-700 dark:text-emerald-300';

            borderColor = 'border-emerald-200 dark:border-emerald-800';

            break;

        default:

            bgColor = 'bg-blue-50 dark:bg-blue-900/20';

            textColor = 'text-blue-700 dark:text-blue-300';

            borderColor = 'border-blue-200 dark:border-blue-800';

    }



    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>

            <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl ${bgColor} border ${borderColor}`} onClick={(e) => e.stopPropagation()}>

                <p className={`font-medium ${textColor} mb-4`}>{message}</p>

                <button 

                    onClick={onClose} 

                    className={`w-full py-2 rounded-lg font-semibold bg-white dark:bg-zinc-800 border border-current ${textColor} hover:opacity-80 transition-opacity`}

                >

                    확인

                </button>

            </div>

        </div>

    );

};



// ====================================================================

// 4. AUTH VIEW

// ====================================================================



function AuthView({ onAuthSuccess }) {

    const [isLogin, setIsLogin] = useState(true);

    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');

    const [name, setName] = useState('');

    const [familyName, setFamilyName] = useState('');

    const [inviteCode, setInviteCode] = useState('');

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');

    const [modal, setModal] = useState({ message: '', type: '' });



    // UUID를 읽기 쉬운 6자리 코드로 변환 (초대 코드 생성용)

    const generateInviteCode = () => crypto.randomUUID().substring(0, 6).toUpperCase();



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



// ====================================================================

// 5. VIEW COMPONENTS

// ====================================================================



// --- Helper Functions ---



const formatDate = (dateString) => {

    if (!dateString) return '오늘 중';

    const date = new Date(dateString);

    const now = new Date();

    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    

    if (diffDays === 0) return '오늘';

    if (diffDays === 1) return '내일';

    if (diffDays === -1) return '어제';



    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

};



// --- Dashboard View ---

function DashboardView({ currentUser, familyMembers, diagnoses, prescriptions }) {

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

                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${

                            d.severityLevel === 'Severe' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 

                            d.severityLevel === 'Moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 

                            d.severityLevel === 'Mild' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :

                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'

                        }`}>

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



// --- Diagnose View ---

function DiagnoseView({ currentUser, onDiagnosisComplete }) {

    const [files, setFiles] = useState([]); 

    const [result, setResult] = useState(null); 

    const [loading, setLoading] = useState(false); 

    const [plantName, setPlantName] = useState(''); 

    const [modal, setModal] = useState({ message: '', type: '' });

    const [step, setStep] = useState(1); // 1: Image Upload, 2: Result



    // 실제 Flask 백엔드 API 호출

    const diagnosePlant = async (imageFile, plantName) => {

        try {

            // FormData 생성

            const formData = new FormData();

            formData.append('image', imageFile);

            formData.append('plantName', plantName);



            // Flask API 호출

            const response = await fetch('http://localhost:5001/api/diagnose', {

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

                                    <span className={`font-bold text-lg ${

                                        result.severityLevel === 'Severe' ? 'text-red-600 dark:text-red-400' : 

                                        result.severityLevel === 'Moderate' ? 'text-amber-600 dark:text-amber-400' : 

                                        result.severityLevel === 'Mild' ? 'text-yellow-600 dark:text-yellow-400' :

                                        'text-green-600 dark:text-green-400'

                                    }`}>

                                        {result.severityLevel === 'Severe' ? '🚨 심각' : 

                                         result.severityLevel === 'Moderate' ? '⚠️ 보통' : 

                                         result.severityLevel === 'Mild' ? '⚡ 경미' :

                                         '✅ 건강'}

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



// --- Schedule View ---

// [REFACTOR] 이제 ScheduleView는 App에서 병합된 prescriptionsProp을 받습니다.

function ScheduleView({ currentUser, familyId, familyMembers, prescriptions: prescriptionsProp }) {

    // Task를 props에서 파생하여 사용하므로, 내부적인 onSnapshot을 제거합니다.

    const [tasks, setTasks] = useState([]);

    const [plantGroups, setPlantGroups] = useState([]);

    const [expandedPlants, setExpandedPlants] = useState(new Set());

    const [modal, setModal] = useState({ message: '', type: '' });

    

    // [REMOVED] useEffect를 제거하고, prescriptionsProp이 변경될 때 Task를 계산합니다.

    useEffect(() => {

        let allTasks = [];

        

        // prescriptionsProp은 이미 App 컴포넌트에서 userName이 병합된 상태입니다.

        prescriptionsProp.forEach((p) => {

            // tasks_json은 내부적으로 Task 배열입니다.

            p.tasks_json.forEach((task, taskIndex) => {

                allTasks.push({

                    ...task,

                    taskIndex: taskIndex, // 배열 내 인덱스

                    prescriptionId: p.id,

                    plantName: p.plantName,

                    userName: p.userName, // App에서 정확하게 계산된 값

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

            // 3. 오늘 마감 여부 체크 (dueAt이 없거나 "오늘 중"인 경우)
            const today = new Date().toDateString();
            const aIsToday = (a.dueAt && new Date(a.dueAt).toDateString() === today) || !a.dueAt;
            const bIsToday = (b.dueAt && new Date(b.dueAt).toDateString() === today) || !b.dueAt;
            if (aIsToday && !bIsToday) return -1;
            if (!aIsToday && bIsToday) return 1;

            // 4. 날짜순 정렬 (가까운 날짜부터)
            const dateA = a.dueAt ? new Date(a.dueAt).getTime() : 0; // dueAt이 없으면 오늘로 간주
            const dateB = b.dueAt ? new Date(b.dueAt).getTime() : 0;
            return dateA - dateB;
        });



        setTasks(allTasks);



        // 식물별로 그룹핑

        const groupedByPlant = {};

        allTasks.forEach(task => {

            if (!groupedByPlant[task.plantName]) {

                groupedByPlant[task.plantName] = [];

            }

            groupedByPlant[task.plantName].push(task);

        });



        // 식물별 그룹을 배열로 변환하고 정렬

        const plantGroupsArray = Object.entries(groupedByPlant).map(([plantName, plantTasks]) => {

            const completedCount = plantTasks.filter(t => t.status === 'done').length;

            const totalCount = plantTasks.length;

            const hasUrgent = plantTasks.some(t => t.title.includes('[긴급]') && t.status !== 'done');

            const hasToday = plantTasks.some(t => ((t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString()) || !t.dueAt) && t.status !== 'done');

            // 미완료 작업 수 계산

            const pendingCount = totalCount - completedCount;

            

            return {

                plantName,

                tasks: plantTasks,

                completedCount,

                totalCount,

                pendingCount,

                hasUrgent,

                hasToday,

                // 우선순위: 긴급 > 오늘 > 나머지

                priority: hasUrgent ? 0 : hasToday ? 1 : 2

            };

        }).sort((a, b) => {

            // 1. 우선순위 순으로 정렬 (긴급 > 오늘 > 나머지)

            if (a.priority !== b.priority) return a.priority - b.priority;

            

            // 2. 같은 우선순위면 미완료 작업이 많은 순 (더 시급한 것)

            if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;

            

            // 3. 미완료 작업 수도 같으면 완료율이 낮은 순

            const aProgress = a.completedCount / a.totalCount;

            const bProgress = b.completedCount / b.totalCount;

            return aProgress - bProgress;

        });



        setPlantGroups(plantGroupsArray);



    }, [prescriptionsProp]); // prescriptionsProp이 업데이트될 때마다 재계산



    // Task 상태 토글 함수: Firestore 업데이트 (로직 유지)

    const toggleTaskStatus = async (prescriptionId, taskIndex, currentStatus) => {

        if (!db) return;



        try {

            const prescriptionRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);

            

            const batch = writeBatch(db);



            // 문서를 가져와서 tasks_json 배열을 직접 업데이트

            const docSnap = await getDoc(prescriptionRef);

            if (!docSnap.exists()) throw new Error("처방 문서가 존재하지 않습니다.");

            

            let tasks_json = docSnap.data().tasks_json;

            

            // 해당 Task의 상태 토글

            if (tasks_json[taskIndex]) {

                tasks_json[taskIndex].status = currentStatus === 'todo' ? 'done' : 'todo';

                

                // Batch 업데이트

                batch.update(prescriptionRef, { tasks_json: tasks_json });

                await batch.commit();



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

            

            // 문서를 가져와서 tasks_json 배열에서 해당 Task 제거

            const docSnap = await getDoc(prescriptionRef);

            if (!docSnap.exists()) throw new Error("처방 문서가 존재하지 않습니다.");

            

            let tasks_json = docSnap.data().tasks_json;

            

            // 해당 Task를 배열에서 제거

            if (tasks_json[taskIndex]) {

                tasks_json.splice(taskIndex, 1);

                

                // 모든 Task가 삭제되면 처방 문서 자체를 삭제

                if (tasks_json.length === 0) {

                    await deleteDoc(prescriptionRef);

                    setModal({ message: '모든 Task가 삭제되어 처방이 완전히 삭제되었습니다.', type: 'success' });

                } else {

                    // 남은 Task가 있으면 배열 업데이트

                    await updateDoc(prescriptionRef, { tasks_json: tasks_json });

                    setModal({ message: 'Task가 삭제되었습니다.', type: 'success' });

                }

            }



        } catch (error) {

            console.error('Task 삭제 실패:', error);

            setModal({ message: `Task 삭제 중 오류 발생: ${error.message}`, type: 'error' });

        }

    };



    // 전체 처방 스케줄 삭제 함수

    const deletePrescription = async (prescriptionId) => {

        if (!db) return;



        try {

            const prescriptionRef = doc(db, COLLECTIONS.PRESCRIPTIONS, prescriptionId);

            // 실제로 문서를 삭제

            await deleteDoc(prescriptionRef);

            setModal({ message: '처방 스케줄이 완전히 삭제되었습니다.', type: 'success' });

        } catch (error) {

            console.error('처방 삭제 실패:', error);

            setModal({ message: `처방 삭제 중 오류 발생: ${error.message}`, type: 'error' });

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

                                                        // 해당 식물의 모든 처방 ID를 수집 (중복 제거)

                                                        const prescriptionIds = [...new Set(plantGroup.tasks.map(task => task.prescriptionId))];

                                                        

                                                        try {

                                                            // 모든 처방을 병렬로 삭제

                                                            await Promise.all(prescriptionIds.map(id => deleteDoc(doc(db, COLLECTIONS.PRESCRIPTIONS, id))));

                                                            setModal({ message: `${plantGroup.plantName}의 모든 처방이 삭제되었습니다.`, type: 'success' });

                                                        } catch (error) {

                                                            console.error('처방 삭제 실패:', error);

                                                            setModal({ message: `처방 삭제 중 오류 발생: ${error.message}`, type: 'error' });

                                                        }

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



// --- Family View ---

function FamilyView({ currentUser, familyId, familyInfo, familyMembers, diagnoses: diagnosesProp, onDiagnosisComplete }) {

    const [loading, setLoading] = useState(false);

    const [inviteCodeInput, setInviteCodeInput] = useState('');

    const [familyNameInput, setFamilyNameInput] = useState('');

    const [modal, setModal] = useState({ message: '', type: '' });

    const [diagnoses, setDiagnoses] = useState([]); // 가족 진단 이력 (App에서 받아와야 하지만, 기존 로직 유지를 위해 남겨둠)



    // RENAME: UUID를 읽기 쉬운 6자리 코드로 변환 (초대 코드 생성용)

    const generateInviteCode = () => crypto.randomUUID().substring(0, 6).toUpperCase();

    const isOwner = familyId && familyInfo?.createdBy === currentUser.uid;



    // 가족 진단 이력 로딩 (App에서 받아온 diagnoses를 사용하도록 수정 예정)

    // NOTE: App에서 diagnoses를 받아와야 하지만, 기존 코드의 구조를 최소한으로 수정하기 위해

    // App 컴포넌트에서 이미 diagnoses를 로드하므로, 이 로직은 주석 처리합니다.

    // App에서 받아온 diagnoses를 prop으로 사용해야 합니다. 

    // 임시로 App에서 전달되지 않은 경우를 대비해 기존 로직을 유지합니다.



    // [REMOVED] App에서 모든 진단 기록을 가져오므로, 이 중복 로직은 제거되어야 합니다.

    // 이 컴포넌트의 diagnoses state는 App에서 prop으로 받아야 합니다.

    /*

    useEffect(() => {

        if (!db || !familyId) {

            setDiagnoses([]);

            return;

        }



        const q = query(

            collection(db, COLLECTIONS.DIAGNOSES),

            where("familyId", "==", familyId)

        );



        const unsubscribe = onSnapshot(q, (snapshot) => {

            const loadedDiagnoses = snapshot.docs.map(doc => doc.data());

            setDiagnoses(loadedDiagnoses.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

        }, (error) => {

            console.error("Error subscribing to diagnoses:", error);

            setModal({ message: "진단 이력 로딩 중 오류가 발생했습니다.", type: 'error' });

        });



        return () => unsubscribe();

    }, [familyId]);

    */

    

    // App에서 받아온 diagnoses prop을 사용하기 위해 임시로 상태를 업데이트합니다.

    useEffect(() => {

        // App에서 전달된 props.diagnoses를 사용하여 로컬 상태를 설정합니다.

        // diagnoses prop이 변경될 때마다 로컬 상태를 업데이트합니다.

        if (diagnosesProp && diagnosesProp.length > 0) {

            setDiagnoses(diagnosesProp.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

        }

    }, [diagnosesProp]); // diagnoses prop을 의존성으로 사용합니다.



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

                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${

                            d.severityLevel === 'Severe' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 

                            d.severityLevel === 'Moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 

                            d.severityLevel === 'Mild' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :

                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'

                        }`}>

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





// --- My Diagnoses View ---

function MyDiagnosesView({ currentUser, diagnoses }) {

    const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);

    const [modal, setModal] = useState({ message: '', type: '' });

    

    // 현재 사용자의 진단 기록만 필터링

    const myDiagnoses = diagnoses.filter(d => d.userId === currentUser.uid);

    

    // 진단 기록을 날짜순으로 정렬 (최신순)

    const sortedDiagnoses = myDiagnoses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    

    const formatDate = (dateString) => {

        const date = new Date(dateString);

        return date.toLocaleDateString('ko-KR', { 

            year: 'numeric', 

            month: 'long', 

            day: 'numeric',

            hour: '2-digit',

            minute: '2-digit'

        });

    };

    

    const getSeverityColor = (severity) => {

        switch (severity) {

            case 'Severe': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';

            case 'Moderate': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300';

            case 'Mild': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';

            case 'Healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';

            default: return 'text-zinc-600 bg-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-300';

        }

    };

    

    const getSeverityIcon = (severity) => {

        switch (severity) {

            case 'Severe': return '🚨';

            case 'Moderate': return '⚠️';

            case 'Mild': return '⚡';

            case 'Healthy': return '✅';

            default: return '❓';

        }

    };

    

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

                                        {formatDate(selectedDiagnosis.createdAt)}

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



// --- Placeholder Views ---

function PlaceholderView({ title }) {

    return (

        <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">

            <PageHeader title={title} description="이 기능은 곧 추가될 예정입니다." />

            <Card>

                <p className="text-zinc-500 text-center py-10">

                    {title} 기능을 준비 중입니다. 잠시만 기다려 주세요!

                </p>

            </Card>

        </div>

    );

}





// ====================================================================

// 6. MAIN APP COMPONENT

// ====================================================================



function ContentArea({ currentUser, familyInfo, familyMembers, diagnoses, prescriptions, onDiagnosisComplete }) {

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

        // [FIX] ScheduleView에 병합된 prescriptions 데이터를 전달합니다.

        schedule: <ScheduleView {...{ currentUser, familyId, familyMembers, prescriptions }} />,

        // [FIX] FamilyView에 병합된 diagnoses 데이터를 전달합니다.

        family: <ErrorBoundary><FamilyView {...{ currentUser, familyId, familyInfo, familyMembers, diagnoses, onDiagnosisComplete }} /></ErrorBoundary>, 

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



// Sidebar Component (UNMODIFIED)

function Sidebar({ open, setOpen, onSignOut, currentUser }) {

    return (

        <div>

            <div 

                className={`fixed inset-0 bg-black/40 lg:hidden transition-opacity z-40 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 

                onClick={() => setOpen(false)} 

            />

            <aside 

                className={`fixed z-50 lg:z-30 inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}

            >

                <div className="h-16 flex items-center gap-2 px-4 border-b border-zinc-200 dark:border-zinc-800">

                    {Icon.logo("w-8 h-8 text-emerald-600")}

                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Plant Doctor</span>

                </div>

                <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-10rem)]"> {/* 10rem = header + footer height */}

                    {NAV_ITEMS.map((item) => (

                        <a 

                            key={item.key} 

                            href={item.href} 

                            onClick={() => setOpen(false)}

                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"

                        >

                            <span className="text-zinc-500 dark:text-zinc-400">{item.icon}</span>

                            <span className="font-medium">{item.label}</span>

                        </a>

                    ))}

                </nav>

                <div className="absolute bottom-0 inset-x-0 p-3 border-t border-zinc-200 dark:border-zinc-800">

                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800">

                        <div className="flex flex-col text-sm truncate">

                            <span className="font-semibold truncate">{currentUser?.name || 'User'}</span>

                            <span className="text-xs text-zinc-500 truncate">{currentUser?.email}</span>

                        </div>

                        <button

                            onClick={onSignOut}

                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"

                            title="로그아웃"

                        >

                            로그아웃

                        </button>

                    </div>

                </div>

            </aside>

        </div>

    );

}



// Topbar Component (Desktop/Mobile Header) - UNMODIFIED

function Topbar({ onMenu }) {

    return (

        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-3 font-inter lg:pl-4">

            <button className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onMenu} aria-label="Open navigation">

                {Icon.menu("w-6 h-6 text-zinc-700 dark:text-zinc-300")}

            </button>

            <div className="hidden lg:flex items-center gap-2 text-zinc-500 text-sm">

                <span>Welcome back!</span>

            </div>

            <div className="ml-auto flex items-center gap-3">

                <a href="#/diagnose" className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold">

                    {Icon.plus("w-4 h-4")} <span>진단 시작</span>

                </a>

            </div>

        </header>

    );

}





export default function App() {

    const [open, setOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);

    const [familyInfo, setFamilyInfo] = useState(null);

    const [familyMembers, setFamilyMembers] = useState([]);

    // [FIX] Raw data states for Firestore documents (before merging user names)

    const [rawDiagnoses, setRawDiagnoses] = useState([]);

    const [rawPrescriptions, setRawPrescriptions] = useState([]);

    // [FIX] Merged data states (passed to children)

    const [diagnoses, setDiagnoses] = useState([]);

    const [prescriptions, setPrescriptions] = useState([]);

    

    const [loading, setLoading] = useState(true);

    const [modal, setModal] = useState({ message: '', type: '' });

    

    // --- Auth Handlers ---

    

    // 1. 초기 인증 및 사용자 프로필 로드 (checkUser UNMODIFIED)

    const checkUser = useCallback(async () => {

        if (!auth || !db) {

            setLoading(false);

            return;

        }



        const handleAuthChange = (user) => {

            if (user) {

                // 사용자 ID와 기본 정보 로드

                loadUserProfile(user.uid);

            } else {

                // 인증 안됨: 초기 토큰으로 시도

                if (initialAuthToken) {

                    signInWithCustomToken(auth, initialAuthToken).catch(console.error);

                }

                // 익명 로그인 제거 - 이메일/비밀번호 로그인만 사용

            }

            setLoading(false);

        };

        

        // onAuthStateChanged는 리스너를 반환합니다.

        const unsubscribe = onAuthStateChanged(auth, handleAuthChange);

        return unsubscribe;



    }, []);



    // 2. 프로필 및 가족 정보 로드 (loadUserProfile UNMODIFIED)

    const loadUserProfile = async (userId) => {

        if (!db) return;

        

        const profileRef = doc(db, COLLECTIONS.PROFILES(userId), 'user_profile');

        // const familyCollectionRef = collection(db, COLLECTIONS.FAMILIES); // Unused variable removed



        // 프로필 실시간 구독

        onSnapshot(profileRef, async (profileSnap) => {

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

                

                // 가족 정보 구독 시작

                if (newCurrentUser.familyId) {

                    subscribeToFamilyData(newCurrentUser.familyId, userId);

                } else {

                    setFamilyInfo(null);

                    setFamilyMembers([]);

                    // 가족이 없을 경우, raw/merged data를 모두 비워줍니다.

                    setRawDiagnoses([]);

                    setRawPrescriptions([]);

                    setDiagnoses([]);

                    setPrescriptions([]);

                }

            } else {

                setCurrentUser({ uid: userId, email: auth.currentUser.email || '익명 사용자', name: '익명 사용자' });

                setModal({ message: "사용자 프로필이 없습니다. 새로고침 후 다시 시도해 주세요.", type: 'error' });

            }

        });

    };

    

    // [FIX] 3. 가족 데이터 실시간 구독 (raw data만 저장)

    const subscribeToFamilyData = (familyId, currentUserId) => {

        if (!db) return;

        

        // --- Family Info ---

        const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);

        onSnapshot(familyRef, (snap) => {

            if (snap.exists()) setFamilyInfo(snap.data());

            else setFamilyInfo(null);

        });

        

        // --- Family Members ---

        const membersQ = query(

            collection(db, COLLECTIONS.USERS_ALL), 

            where("familyId", "==", familyId)

        );

        onSnapshot(membersQ, (snap) => {

            const members = snap.docs.map(d => ({ userId: d.id, ...d.data() }));

            setFamilyMembers(members);

        });



        // --- Diagnoses (Raw) ---

        const diagnosesQ = query(

            collection(db, COLLECTIONS.DIAGNOSES),

            where("familyId", "==", familyId)

        );

        onSnapshot(diagnosesQ, (snap) => {

            setRawDiagnoses(snap.docs.map(d => d.data()));

        });

        

        // --- Prescriptions (Raw) ---

        const prescriptionsQ = query(

            collection(db, COLLECTIONS.PRESCRIPTIONS),

            where("familyId", "==", familyId)

        );

        onSnapshot(prescriptionsQ, (snap) => {

            setRawPrescriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        });

    };



    // [FIX] Raw 데이터와 familyMembers를 병합하여 최종 상태를 계산하는 useEffect

    useEffect(() => {

        // 1. Diagnoses 병합

        const mergedDiags = rawDiagnoses.map(d => {

            const member = familyMembers.find(m => m.userId === d.userId);

            return {

                ...d,

                // members에서 찾거나, 기존 문서의 userName을 폴백으로 사용

                userName: member?.name || d.userName || 'Unknown', 

            };

        });

        setDiagnoses(mergedDiags);



        // 2. Prescriptions 병합 (여기서 userName을 찾아서 주입)

        const mergedPrescs = rawPrescriptions.map(p => {

            const member = familyMembers.find(m => m.userId === p.userId);

            return {

                ...p,

                // members에서 찾습니다.

                userName: member?.name || 'Unknown', 

            };

        });

        setPrescriptions(mergedPrescs);

        

    }, [rawDiagnoses, rawPrescriptions, familyMembers]); // raw data 또는 members가 바뀔 때마다 실행



    const handleAuthSuccess = (userId) => {

        // 회원가입/로그인 후 프로필 다시 로드

        loadUserProfile(userId);

    };



    // 사용자 삭제 시 관련 데이터 정리 함수
    const cleanupUserData = async (userId) => {
        if (!db) return;

        try {
            const batch = writeBatch(db);

            // 1. users_all에서 사용자 제거
            const userAllRef = doc(db, COLLECTIONS.USERS_ALL, userId);
            batch.delete(userAllRef);

            // 2. 사용자의 개인 프로필 삭제
            const userProfileRef = doc(db, COLLECTIONS.PROFILES(userId), 'user_profile');
            batch.delete(userProfileRef);

            // 3. 사용자의 진단 기록 삭제 (familyId가 있는 것들만)
            const diagnosesQuery = query(
                collection(db, COLLECTIONS.DIAGNOSES),
                where("userId", "==", userId)
            );
            const diagnosesSnapshot = await getDocs(diagnosesQuery);
            diagnosesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // 4. 사용자의 처방 스케줄 삭제
            const prescriptionsQuery = query(
                collection(db, COLLECTIONS.PRESCRIPTIONS),
                where("userId", "==", userId)
            );
            const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
            prescriptionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            console.log('사용자 데이터가 성공적으로 정리되었습니다.');

        } catch (error) {
            console.error('사용자 데이터 정리 중 오류:', error);
        }
    };

    const handleSignOut = async () => {

        if (auth) {

            await signOut(auth);

            setCurrentUser(null);

        }

    };

    

    // --- Effects ---

    useEffect(() => {

        checkUser();

        // Add Inter font support via Tailwind

        const link = document.createElement('link');

        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap';

        link.rel = 'stylesheet';

        document.head.appendChild(link);

        document.body.className = 'font-inter';

    }, [checkUser]);





    // --- Render Logic ---



    // 로딩 중이거나 Firebase 초기화 실패 시

    if (loading || !db) {

        return (

            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center font-inter">

                <div className="text-center">

                    {Icon.loading("w-12 h-12 text-emerald-600 mx-auto")}

                    <p className="text-zinc-500 mt-4">{!db ? '데이터베이스 연결 실패. 새로고침 필요.' : '앱을 로딩 중입니다...'}</p>

                </div>

            </div>

        );

    }



    // 로그인되지 않은 경우 인증 화면 표시

    if (!currentUser || !auth.currentUser) {

        return <AuthView onAuthSuccess={handleAuthSuccess} />;

    }

    

    // 메인 앱 렌더링

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

                    onDiagnosisComplete={() => {}} // 진단 완료 후 자동 리다이렉트 제거

                />

            </div>



            {/* Bottom tabbar (mobile) */}

            <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-5 text-xs z-20">

                {NAV_ITEMS.filter(n => n.key !== 'settings').map((item) => (

                    <a key={item.key} href={item.href} className="flex flex-col items-center justify-center py-2 text-zinc-600 dark:text-zinc-300">

                        <span className="w-5 h-5 mb-1">{item.icon}</span>

                        {item.label}

                    </a>

                ))}

            </nav>

        </div>

    );

}
