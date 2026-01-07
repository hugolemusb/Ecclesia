import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { db } from '../../../db';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ServiceProgram } from '../../../types/services';
import { TemplateLibrary } from './TemplateLibrary';
import { MonthlyCalendar } from './MonthlyCalendar';
import { CleaningManager } from './cleaning/CleaningManager';

export const ServicesManager: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [programs, setPrograms] = useState<ServiceProgram[]>([]);
    const [sidebarWidth, setSidebarWidth] = useState(320); // pixels

    const [viewMode, setViewMode] = useState<'calendar' | 'history' | 'aseo'>('calendar');
    useEffect(() => {
        const loadPrograms = async () => {
            try {
                const state = await db.loadAll();
                if (state.events && state.events.length > 0) {
                    // Convert CalendarEvent to ServiceProgram
                    const programs: ServiceProgram[] = state.events.map(event => ({
                        id: event.id,
                        title: event.title || "Sin título",
                        type: "culto-dominical-am" as ServiceType,
                        date: new Date(event.startDate),
                        time: new Date(event.startDate).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
                        minister: "",
                        status: "confirmed" as ServiceStatus,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: 1,
                        sections: []
                    }));
                    setPrograms(programs);
                }
            } catch (error) {
                console.error("Error loading programs:", error);
            }
        };
        loadPrograms();
    }, []);

    const handleProgramsChange = async (updated: ServiceProgram[]) => {
        setPrograms(updated);
        // Save to database (sync with Dashboard calendar)
        const state = await db.loadAll();
        // Convert ServiceProgram to CalendarEvent
        const events = updated.map(program => ({
            id: program.id,
            title: program.title,
            description: program.sections.find(s => s.type === "notes")?.data?.content || "",
            type: "sermon" as any,
            startDate: new Date(program.date).toISOString(),
            endDate: new Date(program.date).toISOString(),
            location: "",
        }));
        await db.saveAll({ ...state, events });
    };

    const handleDuplicateProgram = (program: ServiceProgram) => {
        const duplicated: ServiceProgram = {
            ...program,
            id: Date.now().toString(),
            title: `${program.title} (Copia)`,
            date: new Date(),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        handleProgramsChange([...programs, duplicated]);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            
            {/* View Mode Tabs */}
            <div className="bg-white border-b p-4 flex gap-2">
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        viewMode === 'calendar'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                >
                    📅 Calendario
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        viewMode === 'history'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                >
                    📜 Histórico
                </button>
                <button
                    onClick={() => setViewMode('aseo')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        viewMode === 'aseo'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                >
                    🧹 Aseo del Templo
                </button>
            </div>

{viewMode === 'calendar' && (
                <div className="h-screen flex bg-gray-50">
                {/* Template Library Sidebar */}
                <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0">
                    <TemplateLibrary
                        onTemplateSelect={(template) => console.log('Template selected:', template)}
                    />
                </div>

                {/* Resize Handle */}
                <div
                    className="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-400 transition-colors"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startWidth = sidebarWidth;

                        const handleMouseMove = (e: MouseEvent) => {
                            const delta = e.clientX - startX;
                            const newWidth = Math.max(250, Math.min(500, startWidth + delta));
                            setSidebarWidth(newWidth);
                        };

                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                />

                {/* Main Calendar Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <MonthlyCalendar
                        selectedMonth={selectedMonth}
                        onMonthChange={setSelectedMonth}
                        programs={programs}
                        onProgramsChange={handleProgramsChange}
                    />
                </div>
            </div>
                    )}

            {viewMode === 'aseo' && (
                <CleaningManager />
            )}

        </DndProvider>
    );
};
