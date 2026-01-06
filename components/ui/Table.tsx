import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

function Table<T>({
    data,
    columns,
    keyExtractor,
    onRowClick,
    isLoading,
    emptyMessage = "No se encontraron datos",
    pagination
}: TableProps<T>) {

    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center justify-center animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full bg-white rounded-3xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 text-3xl font-black">?</div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            {columns.map((col, i) => (
                                <th key={i} className={`p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                            >
                                {columns.map((col, i) => (
                                    <td key={i} className={`p-5 text-xs font-bold text-slate-700 ${col.className || ''} group-hover:text-slate-900 transition-colors`}>
                                        {col.accessor(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                        Página {pagination.currentPage} de {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Table;
