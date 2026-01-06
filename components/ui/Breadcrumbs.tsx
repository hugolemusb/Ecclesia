import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    homeIcon?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, homeIcon = true }) => {
    return (
        <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 animate-in slide-in-from-left-2 duration-300">
            {homeIcon && (
                <div className="flex items-center">
                    <Home size={12} className="text-slate-300" />
                    <ChevronRight size={10} className="mx-2 text-slate-300" />
                </div>
            )}

            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={index}>
                        <div
                            className={`flex items-center gap-2 ${item.onClick && !isLast ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''} ${isLast ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-lg' : ''}`}
                            onClick={!isLast ? item.onClick : undefined}
                        >
                            {item.icon && <span>{item.icon}</span>}
                            <span>{item.label}</span>
                        </div>
                        {!isLast && <ChevronRight size={10} className="text-slate-300" />}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
