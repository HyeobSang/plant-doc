// src/components/layout/Sidebar.jsx

import React from 'react';
import { Icon, NAV_ITEMS } from '../common/Icons';

export default function Sidebar({ open, setOpen, onSignOut, currentUser }) {
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