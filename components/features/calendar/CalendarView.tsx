
import React, { useState, useEffect } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear,
    eachDayOfInterval, eachMonthOfInterval, isSameMonth, isSameDay,
    addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears,
    isWithinInterval, getDay, startOfDay, endOfDay, differenceInDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarEvent } from '../../../types';
import { db } from '../../../db';
import { AdvancedEventModal } from './AdvancedEventModal';
import { detectConflicts } from './ConflictDetector';
import { CALENDAR_EVENT_TYPES, EVENT_ROLES } from '../../../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'gantt';

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewMode>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        const state = await db.loadAll();
        if (state.events) setEvents(state.events);
    };

    const handleSaveEvent = async (newEvent: CalendarEvent) => {
        const conflict = detectConflicts(newEvent, events);
        if (conflict.hasConflict) {
            if (!window.confirm(`CONFLICTOS DETECTADOS:\n\n${conflict.messages.join('\n')}\n\n¿Guardar de todos modos?`)) return;
        }

        let updatedEvents = [...events];
        const index = updatedEvents.findIndex(e => e.id === newEvent.id);
        if (index >= 0) updatedEvents[index] = newEvent;
        else updatedEvents.push(newEvent);

        setEvents(updatedEvents);
        const state = await db.loadAll();
        state.events = updatedEvents;
        await db.saveAll(state);
        setIsModalOpen(false);
    };

    const handleDeleteEvent = async (id: string) => {
        const updatedEvents = events.filter(e => e.id !== id);
        setEvents(updatedEvents);
        const state = await db.loadAll();
        state.events = updatedEvents;
        await db.saveAll(state);
        setIsModalOpen(false);
    };

    // Navigation Logic
    const navigate = (direction: 'prev' | 'next') => {
        const amount = direction === 'next' ? 1 : -1;
        switch (view) {
            case 'day': setCurrentDate(addDays(currentDate, amount)); break;
            case 'week': setCurrentDate(addWeeks(currentDate, amount)); break;
            case 'month': setCurrentDate(addMonths(currentDate, amount)); break;
            case 'year': setCurrentDate(addYears(currentDate, amount)); break;
            case 'gantt': setCurrentDate(addMonths(currentDate, amount)); break;
        }
    };

    // Filtering
    const getFilteredEvents = (start: Date, end: Date) => {
        return events.filter(e => {
            if (filterType !== 'all' && e.type !== filterType) return false;
            const eventStart = new Date(e.startDate);
            return isWithinInterval(eventStart, { start, end });
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    };

    // --- VIEW RENDERERS ---

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold font-heading text-slate-800 capitalize">
                    {view === 'year'
                        ? format(currentDate, 'yyyy', { locale: es })
                        : format(currentDate, 'MMMM yyyy', { locale: es })}
                </h1>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {(['day', 'week', 'month', 'year', 'gantt'] as const).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1 rounded-md text-sm font-bold capitalize transition-all ${view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {{ day: 'Día', week: 'Semana', month: 'Mes', year: 'Año', gantt: 'Gantt' }[v]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 items-center">
                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                    <button onClick={() => navigate('prev')} className="p-2 hover:bg-slate-200 rounded-l-lg text-slate-500">◀</button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 border-x border-slate-200">Hoy</button>
                    <button onClick={() => navigate('next')} className="p-2 hover:bg-slate-200 rounded-r-lg text-slate-500">▶</button>
                </div>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border-slate-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="all">Todos los tipos</option>
                    {CALENDAR_EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <button onClick={handlePrint} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors" title="Imprimir Vista">
                    🖨️
                </button>

                <button
                    onClick={() => { setSelectedEvent(null); setSelectedDay(currentDate); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
                >
                    + Nuevo
                </button>
            </div>
        </div>
    );

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

        return (
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="bg-slate-50 p-3 text-center text-xs font-black text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
                {days.map(day => {
                    const dayEvents = getFilteredEvents(startOfDay(day), endOfDay(day));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => { setSelectedDay(day); setSelectedEvent(null); setIsModalOpen(true); }}
                            className={`bg-white min-h-[120px] p-2 hover:bg-blue-50/30 transition-colors cursor-pointer group flex flex-col gap-1 ${!isCurrentMonth ? 'bg-slate-50/50' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {format(day, 'd')}
                                </span>
                                <button className="opacity-0 group-hover:opacity-100 text-xs font-bold text-blue-400 hover:text-blue-600">+</button>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 mt-1">
                                {dayEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setIsModalOpen(true); }}
                                        className="text-[10px] px-2 py-1 rounded border-l-4 shadow-sm hover:shadow-md transition-all truncate font-semibold"
                                        style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}15`, color: '#334155' }}
                                    >
                                        {format(new Date(ev.startDate), 'HH:mm')} {ev.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return (
            <div className="grid grid-cols-7 gap-4 h-full min-h-[500px]">
                {days.map(day => {
                    const dayEvents = getFilteredEvents(startOfDay(day), endOfDay(day));
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div key={day.toISOString()} className={`flex flex-col rounded-xl border ${isToday ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200 bg-white'}`}>
                            <div className={`p-3 text-center border-b ${isToday ? 'border-blue-200' : 'border-slate-100'}`}>
                                <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">{format(day, 'EEEE', { locale: es })}</div>
                                <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{format(day, 'd')}</div>
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                <button
                                    onClick={() => { setSelectedDay(day); setSelectedEvent(null); setIsModalOpen(true); }}
                                    className="w-full py-2 mb-2 text-xs font-bold text-slate-400 border border-dashed border-slate-300 rounded hover:bg-slate-50 hover:text-slate-600 transition-colors"
                                >
                                    + Agregar
                                </button>
                                {dayEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setIsModalOpen(true); }}
                                        className="p-2 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        style={{ borderColor: ev.color, backgroundColor: 'white' }}
                                    >
                                        <div className="text-xs font-bold" style={{ color: ev.color }}>{format(new Date(ev.startDate), 'HH:mm')}</div>
                                        <div className="text-xs font-semibold text-slate-700 truncate">{ev.title}</div>
                                        {ev.location && <div className="text-[10px] text-slate-400 truncate">📍 {ev.location}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const eventsToday = getFilteredEvents(startOfDay(currentDate), endOfDay(currentDate));
        return (
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 capitalize mb-1">{format(currentDate, 'EEEE d', { locale: es })}</h2>
                        <p className="text-slate-500 font-medium">{format(currentDate, 'MMMM yyyy', { locale: es })}</p>
                    </div>
                    <button
                        onClick={() => { setSelectedDay(currentDate); setSelectedEvent(null); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700"
                    >
                        + Evento Hoy
                    </button>
                </div>
                <div className="flex-1 p-6 space-y-4">
                    {eventsToday.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">No hay eventos programados para este día.</div>
                    ) : (
                        eventsToday.map(ev => (
                            <div key={ev.id} className="flex gap-6 group cursor-pointer" onClick={() => { setSelectedEvent(ev); setIsModalOpen(true); }}>
                                <div className="w-20 text-right pt-2">
                                    <div className="text-lg font-bold text-slate-700">{format(new Date(ev.startDate), 'HH:mm')}</div>
                                    <div className="text-xs font-medium text-slate-400">{format(new Date(ev.endDate || ev.startDate), 'HH:mm')}</div>
                                </div>
                                <div className="flex-1 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all bg-white border border-slate-100" style={{ borderLeftColor: ev.color }}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-slate-800">{ev.title}</h3>
                                        <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">{ev.type}</span>
                                    </div>
                                    {ev.location && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">📍 {ev.location}</p>}
                                    {ev.description && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded italic">{ev.description}</p>}

                                    {/* Quick Details for Day View */}
                                    <div className="mt-3 flex gap-4 text-xs">
                                        {ev.ministryId && <span className="font-semibold text-blue-600">🏛 {ev.ministryId}</span>}
                                        {ev.logistics?.resources?.length ? <span className="font-semibold text-purple-600">📦 Recursos Solicitados</span> : null}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderYearView = () => {
        const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {months.map(month => {
                    const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
                    const isCurrentMonth = isSameMonth(month, new Date());
                    return (
                        <div key={month.toISOString()} className={`bg-white p-4 rounded-xl border ${isCurrentMonth ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 text-center">{format(month, 'MMMM', { locale: es })}</h3>
                            <div className="grid grid-cols-7 gap-1 text-[10px]">
                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <div key={d} className="text-center text-slate-400 font-black">{d}</div>)}
                                {days.map(day => {
                                    const hasEvent = events.some(e => isSameDay(new Date(e.startDate), day) && (filterType === 'all' || e.type === filterType));
                                    const isMonth = isSameMonth(day, month);
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`h-6 flex items-center justify-center rounded-full  
                                                ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white font-bold' : ''}
                                                ${!isMonth ? 'opacity-20' : ''}
                                                ${hasEvent && !isSameDay(day, new Date()) ? 'bg-green-100 text-green-700 font-bold' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderGanttView = () => {
        // Simple Gantt: List of events sorted by date, displayed as linear bars
        const ganttEvents = getFilteredEvents(startOfMonth(currentDate), endOfMonth(currentDate));
        const totalDays = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Cronograma de Actividades - {format(currentDate, 'MMMM', { locale: es })}</h3>
                    <span className="text-xs font-medium text-slate-500">{ganttEvents.length} eventos</span>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px] p-6 space-y-6">
                        {ganttEvents.map(ev => {
                            const start = new Date(ev.startDate);
                            const end = new Date(ev.endDate);
                            const dayOfMonth = start.getDate();
                            // Calculate position percentage roughly
                            const leftPct = ((dayOfMonth - 1) / totalDays) * 100;
                            const widthPct = Math.max(((differenceInDays(end, start) + 1) / totalDays) * 100, 5); // min 5% width

                            return (
                                <div key={ev.id} className="relative h-12 flex items-center group">
                                    {/* Label */}
                                    <div className="w-1/4 pr-4 text-right">
                                        <div className="text-sm font-bold text-slate-700 truncate">{ev.title}</div>
                                        <div className="text-xs text-slate-400">{format(start, 'dd MMM')} - {format(end, 'dd MMM')}</div>
                                    </div>

                                    {/* Track */}
                                    <div className="flex-1 h-8 bg-slate-100 rounded-full relative overflow-hidden">
                                        {/* Grid lines */}
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className="absolute h-full w-px bg-slate-200" style={{ left: `${i * 10}%` }} />
                                        ))}

                                        {/* Bar */}
                                        <div
                                            className="absolute h-full rounded-full shadow-sm hover:shadow-lg transition-all cursor-pointer flex items-center px-4 text-white text-xs font-bold whitespace-nowrap overflow-hidden"
                                            style={{
                                                left: `${leftPct}%`,
                                                width: `${widthPct}%`,
                                                backgroundColor: ev.color || '#3B82F6',
                                                zIndex: 10
                                            }}
                                            onClick={() => { setSelectedEvent(ev); setIsModalOpen(true); }}
                                        >
                                            {ev.type}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {ganttEvents.length === 0 && <div className="text-center text-slate-400 italic">No hay eventos para mostrar en este período.</div>}
                    </div>
                </div>
            </div>
        );
    };

    // --- PRINTING LOGIC ---
    const handlePrint = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(`Calendario Ecclesia: ${format(currentDate, 'MMMM yyyy', { locale: es })}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Vista: ${view.toUpperCase()} | Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);

        // Define Start/End based on view
        let start = startOfMonth(currentDate);
        let end = endOfMonth(currentDate);
        if (view === 'day') { start = startOfDay(currentDate); end = endOfDay(currentDate); }
        if (view === 'week') { start = startOfWeek(currentDate); end = endOfWeek(currentDate); }
        if (view === 'year') { start = startOfYear(currentDate); end = endOfYear(currentDate); }

        const printEvents = getFilteredEvents(start, end);

        const data = printEvents.map(e => [
            format(new Date(e.startDate), 'dd/MM/yyyy'),
            format(new Date(e.startDate), 'HH:mm'),
            format(new Date(e.endDate), 'HH:mm'),
            e.title,
            e.type,
            e.location || '-',
            e.ministryId || '-'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Fecha', 'Inicio', 'Fin', 'Evento', 'Tipo', 'Lugar', 'Ministerio']],
            body: data,
            theme: 'striped',
            headStyles: { fillColor: [41, 58, 128] },
            styles: { fontSize: 8 }
        });

        // Add Roles Summary if Day View
        if (view === 'day' && printEvents.length > 0) {
            // @ts-ignore
            let y = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Resumen de Responsables del Día", 14, y);
            y += 5;

            const rolesSummary: any[] = [];
            printEvents.forEach(e => {
                if (e.assignments) {
                    Object.entries(e.assignments).forEach(([role, names]) => {
                        // @ts-ignore
                        rolesSummary.push([e.title, role, names.join(', ')]);
                    });
                }
            });

            if (rolesSummary.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Evento', 'Rol', 'Asignado a']],
                    body: rolesSummary,
                    theme: 'grid'
                });
            }
        }

        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-screen">
            {renderHeader()}

            <div className="animate-fadeIn">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
                {view === 'year' && renderYearView()}
                {view === 'gantt' && renderGanttView()}
            </div>

            <AdvancedEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialEvent={selectedEvent}
                selectedDate={selectedDay || new Date()}
            />
        </div>
    );
}
