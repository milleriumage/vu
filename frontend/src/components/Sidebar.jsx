import React from 'react';
import { LayoutDashboard, Bot, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ currentView, onNavigate }) {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
        { icon: Bot, label: 'My Bots', view: 'bots' },
        { icon: FileText, label: 'Rules & Scripts', view: 'rules' },
        { icon: Settings, label: 'Settings', view: 'settings' },
    ];

    return (
        <div className="w-64 h-screen bg-surface border-r border-white/5 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    IMVU<span className="text-white">Bot</span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">SaaS Automation Panel</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onNavigate && onNavigate(item.view)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.view
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
