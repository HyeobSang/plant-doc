// src/hooks/useFamilyData.js

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

import { db, COLLECTIONS } from '../api/firebase';

export default function useFamilyData(familyId) {
    const [familyInfo, setFamilyInfo] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [rawDiagnoses, setRawDiagnoses] = useState([]);
    const [rawPrescriptions, setRawPrescriptions] = useState([]);
    const [diagnoses, setDiagnoses] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    
    // 1. Firestore 데이터 구독
    const subscribeToFamilyData = useCallback(() => {
        if (!db || !familyId) {
            setFamilyInfo(null);
            setFamilyMembers([]);
            setRawDiagnoses([]);
            setRawPrescriptions([]);
            return () => {}; // No subscription needed
        }
        
        const unsubscribers = [];

        // --- Family Info ---
        const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
        unsubscribers.push(onSnapshot(familyRef, (snap) => {
            if (snap.exists()) setFamilyInfo(snap.data());
            else setFamilyInfo(null);
        }));
        
        // --- Family Members ---
        const membersQ = query(
            collection(db, COLLECTIONS.USERS_ALL), 
            where("familyId", "==", familyId)
        );
        unsubscribers.push(onSnapshot(membersQ, (snap) => {
            const members = snap.docs.map(d => ({ userId: d.id, ...d.data() }));
            setFamilyMembers(members);
        }));

        // --- Diagnoses (Raw) ---
        const diagnosesQ = query(
            collection(db, COLLECTIONS.DIAGNOSES),
            where("familyId", "==", familyId)
        );
        unsubscribers.push(onSnapshot(diagnosesQ, (snap) => {
            setRawDiagnoses(snap.docs.map(d => d.data()));
        }));
        
        // --- Prescriptions (Raw) ---
        const prescriptionsQ = query(
            collection(db, COLLECTIONS.PRESCRIPTIONS),
            where("familyId", "==", familyId)
        );
        unsubscribers.push(onSnapshot(prescriptionsQ, (snap) => {
            setRawPrescriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));

        // Cleanup function
        return () => unsubscribers.forEach(unsub => unsub());
    }, [familyId]);

    // Firestore 구독 실행
    useEffect(() => {
        const unsubscribe = subscribeToFamilyData();
        return unsubscribe;
    }, [subscribeToFamilyData]);

    // 2. Raw 데이터와 familyMembers를 병합하여 최종 상태를 계산
    useEffect(() => {
        // 1. Diagnoses 병합
        const mergedDiags = rawDiagnoses.map(d => {
            const member = familyMembers.find(m => m.userId === d.userId);
            return {
                ...d,
                userName: member?.name || d.userName || 'Unknown', 
            };
        });
        setDiagnoses(mergedDiags);

        // 2. Prescriptions 병합
        const mergedPrescs = rawPrescriptions.map(p => {
            const member = familyMembers.find(m => m.userId === p.userId);
            return {
                ...p,
                userName: member?.name || 'Unknown', 
            };
        });
        setPrescriptions(mergedPrescs);
        
    }, [rawDiagnoses, rawPrescriptions, familyMembers]);

    return { 
        familyInfo, 
        familyMembers, 
        diagnoses, 
        prescriptions 
    };
}