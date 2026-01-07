import React from 'react';
import {
    LayoutDashboard, Users, UsersRound, ClipboardCheck, Search, Sparkles,
    Settings as SettingsIcon, LogOut, ChevronRight, Church as ChurchIcon, Calendar
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentUser: User;
    onLogout: () => void;
    isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout, isOpen = true }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard Pastoral', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'PASTOR', 'LIDER'] },
        { id: 'members', label: 'Hermandad', icon: <Users size={20} />, roles: ['ADMIN', 'PASTOR', 'LIDER', 'VOLUNTARIO'] },
        { id: 'families', label: 'Grupos Familiares', icon: <UsersRound size={20} />, roles: ['ADMIN', 'PASTOR', 'LIDER'] },
        { id: 'surveys', label: 'Encuestas', icon: <ClipboardCheck size={20} />, roles: ['ADMIN', 'PASTOR', 'LIDER'] },
        { id: 'services-management', label: 'Gestión de Servicios', icon: <Calendar size={20} />, roles: ['ADMIN', 'PASTOR', 'LIDER'] },
        { id: 'analysis', label: 'Análisis IA', icon: <Sparkles size={20} />, roles: ['ADMIN', 'PASTOR'] },
        { id: 'settings', label: 'Configuración', icon: <SettingsIcon size={20} />, roles: ['ADMIN'] },
    ];

    const visibleItems = menuItems.filter(item => item.roles.includes(currentUser?.rol || 'VIEWER'));

    if (!isOpen) return null;

    return (
        <aside className="w-72 bg-slate-900 flex flex-col h-screen shadow-2xl transition-all duration-300">
            {/* Brand */}
            <div className="p-8 flex items-center gap-4 border-b border-white/5">
                <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/40">
                    <ChurchIcon size={28} />
                </div>
                <div className="min-w-0">
                    <span className="block font-bold text-xl text-white tracking-tight truncate">IMP Lo Prado</span>
                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mt-0.5 opacity-80">Ecclesia Insights</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                {visibleItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 scale-[1.02]'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <div className={`${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                            {item.icon}
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                        {activeTab === item.id && <ChevronRight size={16} className="ml-auto opacity-60" />}
                    </button>
                ))}
            </nav>

            {/* User & Logout */}
            <div className="p-6 border-t border-white/5">
                <div className="bg-white/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                        {currentUser.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{currentUser.nombre}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentUser.rol}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-5 py-3 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all font-bold text-sm"
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
