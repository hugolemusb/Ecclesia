import React from 'react';
import { FileText, Menu, Church } from 'lucide-react';
import { User } from '../types';
import Button from './ui/Button';

interface HeaderProps {
    title: string;
    currentUser: User;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentUser, onToggleSidebar }) => {
    // Helper to format role for display
    const getRoleDisplay = (role: string) => {
        const roles: Record<string, string> = {
            'ADMIN': 'Administrador del Sistema',
            'PASTOR': 'Pastor Principal',
            'LIDER': 'Líder Ministerial',
            'VOLUNTARIO': 'Voluntario',
            'GUIA': 'Guía Espiritual'
        };
        return roles[role] || role;
    };

    return (
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm/50">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="lg:hidden p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Church size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight hidden sm:block">
                    {title}
                </h2>
            </div>

            <div className="flex items-center gap-6">
                <Button
                    variant="secondary"
                    size="sm"
                    className="hidden md:flex gap-2"
                    leftIcon={<FileText size={16} />}
                >
                    Reporte Rápido
                </Button>

                <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">{currentUser.nombre}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{getRoleDisplay(currentUser.rol)}</p>
                    </div>
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombre)}&background=0D8ABC&color=fff`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-md ring-2 ring-slate-100"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
