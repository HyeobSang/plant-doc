// src/components/layout/Topbar.jsx

import React from 'react';
import { Icon } from '../common/Icons';

export default function Topbar({ onMenu }) {
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