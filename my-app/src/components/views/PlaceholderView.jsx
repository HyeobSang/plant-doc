// src/components/views/PlaceholderView.jsx

import React from 'react';
import { Card, PageHeader } from '../common/Card';

export default function PlaceholderView({ title }) {
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