import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ServiceProgram } from '../../../types/services';
import { TemplateLibrary } from './TemplateLibrary';
import { MonthlyCalendar } from './MonthlyCalendar';

export const ServicesManager: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [programs, setPrograms] = useState<ServiceProgram[]>([]);
    const [sidebarWidth, setSidebarWidth] = useState(320); // pixels

    useEffect(() => {
        // Load programs from localStorage
        const savedPrograms = localStorage.getItem('servicePrograms');
        if (savedPrograms) {
            const parsed = JSON.parse(savedPrograms);
            // Convert date strings back to Date objects
            const programsWithDates = parsed.map((p: any) => ({
                ...p,
                date: new Date(p.date),
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt),
            }));
            setPrograms(programsWithDates);
        }
    }, []);

    const handleProgramsChange = (updated: ServiceProgram[]) => {
        setPrograms(updated);
        // Save to localStorage
        localStorage.setItem('servicePrograms', JSON.stringify(updated));
    };

    return (
        <DndProvider backend={HTML5Backend}>
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
        </DndProvider>
    );
};
