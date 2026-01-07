import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ServiceProgram } from '../../../types/services';
import { DayView } from './DayView';

interface MonthlyCalendarProps {
    selectedMonth: Date;
    onMonthChange: (month: Date) => void;
    programs: ServiceProgram[];
    onProgramsChange: (programs: ServiceProgram[]) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
    selectedMonth,
    onMonthChange,
    programs,
    onProgramsChange
}) => {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const getProgramsForDay = (day: Date) => {
        return programs.filter(p =>
            format(p.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        );
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(selectedMonth);
        newMonth.setMonth(selectedMonth.getMonth() + (direction === 'next' ? 1 : -1));
        onMonthChange(newMonth);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 min-w-[200px] text-center">
                        {MONTHS[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                    </h2>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    onClick={() => setSelectedDay(new Date())}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nuevo Servicio
                </button>
            </div>

            {/* Month Tabs (12 months) */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
                {MONTHS.map((month, idx) => {
                    const monthDate = new Date(selectedMonth.getFullYear(), idx, 1);
                    const isSelected = idx === selectedMonth.getMonth();
                    return (
                        <button
                            key={idx}
                            onClick={() => onMonthChange(monthDate)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${isSelected
                                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {month.slice(0, 3)}
                        </button>
                    );
                })}
            </div>

            {/* Content Area - Calendar or Day View */}
            {selectedDay ? (
                <DayView
                    date={selectedDay}
                    programs={getProgramsForDay(selectedDay)}
                    onClose={() => setSelectedDay(null)}
                    onProgramsChange={onProgramsChange}
                    allPrograms={programs}
                />
            ) : (
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Empty cells for days before month starts */}
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
                            <div key={`empty-${idx}`} className="aspect-square" />
                        ))}

                        {/* Day Cards */}
                        {days.map(day => {
                            const dayPrograms = getProgramsForDay(day);
                            const isCurrentDay = isToday(day);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDay(day)}
                                    className={`aspect-square border-2 rounded-lg p-2 transition-all hover:shadow-md ${isCurrentDay
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-400'
                                        }`}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className={`text-sm font-bold mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'
                                            }`}>
                                            {format(day, 'd')}
                                        </div>

                                        {dayPrograms.length > 0 && (
                                            <div className="flex-1 flex flex-col gap-1 mt-1">
                                                {dayPrograms.slice(0, 2).map(program => (
                                                    <div
                                                        key={program.id}
                                                        className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate"
                                                        title={program.title}
                                                    >
                                                        {program.time} {program.title}
                                                    </div>
                                                ))}
                                                {dayPrograms.length > 2 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{dayPrograms.length - 2} más
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {dayPrograms.length > 0 && (
                                            <div className="mt-auto pt-1">
                                                <span className="text-xs font-bold text-blue-600">
                                                    {dayPrograms.length} servicio{dayPrograms.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
