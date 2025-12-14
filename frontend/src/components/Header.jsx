import React from 'react';
import { Bell, User } from 'lucide-react';

export default function Header() {
    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-white">Dashboard</h2>

            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">Admin User</p>
                        <p className="text-xs text-gray-400">Pro Plan</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                        AU
                    </div>
                </div>
            </div>
        </header>
    );
}
