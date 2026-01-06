
import React, { useState, useEffect } from 'react';
import { CalendarEvent, ServiceProgramItem, LogisticsRequirements } from '../../../types';
import { CALENDAR_EVENT_TYPES, OFFICIAL_MINISTRIES, DEFAULT_CHURCH_LOCALS, SERVICE_TEMPLATES, EVENT_ROLES } from '../../../constants';
import { addMinutes, format, parse, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdvancedEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void;
    initialEvent?: CalendarEvent | null;
    selectedDate?: Date;
}

export const AdvancedEventModal: React.FC<AdvancedEventModalProps> = ({ isOpen, onClose, onSave, onDelete, initialEvent, selectedDate }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState<'general' | 'program' | 'roles' | 'logistics'>('general');
    const [customRoles, setCustomRoles] = useState<string[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [newResourceName, setNewResourceName] = useState('');

    // Config for editing custom items
    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [editingRoleValue, setEditingRoleValue] = useState('');

    const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
    const [editingResourceValue, setEditingResourceValue] = useState('');


    // Form State
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        title: '',
        type: 'sermon',
        status: 'scheduled',
        startDate: '',
        endDate: '',
        location: 'Iglesia Matriz',
        description: '',
        ministryId: 'Iglesia Matriz', // Default ministry
        program: [],
        assignments: {},
        logistics: { resources: [], keysRequired: false, customResources: [] },
        observations: ''
    });

    // Initialize
    useEffect(() => {
        if (initialEvent) {
            // Restore any custom roles
            const existingRoles = Object.keys(initialEvent.assignments || {});
            const standardRoles = new Set(EVENT_ROLES);
            const extraRoles = existingRoles.filter(r => !standardRoles.has(r));
            setCustomRoles(extraRoles);

            setFormData({
                ...initialEvent,
                startDate: initialEvent.startDate || initialEvent.date + 'T' + initialEvent.time,
                endDate: initialEvent.endDate || initialEvent.date + 'T' + (initialEvent.endTime || '23:59'),
                program: initialEvent.program || [],
                assignments: initialEvent.assignments || {},
                ministryId: initialEvent.ministryId || 'Iglesia Matriz',
                location: initialEvent.localId || initialEvent.location || 'Iglesia Matriz',
                logistics: {
                    resources: [],
                    keysRequired: false,
                    customResources: [],
                    ...initialEvent.logistics
                },
                observations: initialEvent.observations || ''
            });
        } else if (selectedDate) {
            const start = selectedDate.toISOString().slice(0, 10) + 'T10:00';
            const end = selectedDate.toISOString().slice(0, 10) + 'T12:00';
            setFormData({
                title: '',
                type: 'sermon',
                status: 'scheduled',
                startDate: start,
                endDate: end,
                location: 'Iglesia Matriz',
                ministryId: 'Iglesia Matriz',
                program: [],
                assignments: {},
                logistics: { resources: [], keysRequired: false, customResources: [] },
                observations: ''
            });
            setCustomRoles([]);
        }
    }, [initialEvent, selectedDate]);

    // Handlers
    const handleChange = (field: keyof CalendarEvent, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const applyTemplate = (templateKey: string) => {
        // @ts-ignore
        const template = SERVICE_TEMPLATES[templateKey];
        if (template) {
            setFormData(prev => {
                const updated = {
                    ...prev,
                    title: template.title,
                    type: template.type,
                    program: template.program.map((item: any, idx: number) => ({ ...item, id: Date.now() + idx + '' }))
                };
                return recalculateProgramTimes(updated);
            });
        }
    };

    // --- Dynamic Time Logic ---
    const recalculateProgramTimes = (currentData: Partial<CalendarEvent>, explicitStart?: Date): Partial<CalendarEvent> => {
        if (!currentData.program) return currentData;

        let startTime: Date | null = explicitStart || null;

        if (!startTime) {
            if (currentData.program.length > 0 && currentData.program[0].time && currentData.startDate) {
                const datePart = currentData.startDate.split('T')[0];
                const possibleStart = parse(`${datePart}T${currentData.program[0].time}`, "yyyy-MM-dd'T'HH:mm", new Date());
                if (isValid(possibleStart)) startTime = possibleStart;
            }

            if (!startTime && currentData.startDate) {
                startTime = parse(currentData.startDate, "yyyy-MM-dd'T'HH:mm", new Date());
            }
        }

        if (!startTime || !isValid(startTime)) return currentData;

        let runner = startTime;

        const newProgram = currentData.program.map((item, idx) => {
            const timeStr = format(runner, 'HH:mm');
            const newItem = { ...item, time: timeStr };
            runner = addMinutes(runner, item.duration);
            return newItem;
        });

        return { ...currentData, program: newProgram };
    };

    const updateProgramItem = (index: number, field: keyof ServiceProgramItem, value: any) => {
        setFormData(prev => {
            const newProgram = [...(prev.program || [])];
            newProgram[index] = { ...newProgram[index], [field]: value };

            if (field === 'time' && index === 0) {
                if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                    const datePart = prev.startDate?.split('T')[0] || new Date().toISOString().split('T')[0];
                    const newStart = parse(`${datePart}T${value}`, "yyyy-MM-dd'T'HH:mm", new Date());
                    if (isValid(newStart)) {
                        return recalculateProgramTimes({ ...prev, program: newProgram }, newStart);
                    }
                }
                return { ...prev, program: newProgram };
            }

            if (field === 'duration') {
                return recalculateProgramTimes({ ...prev, program: newProgram });
            }
            return { ...prev, program: newProgram };
        });
    };

    const addProgramItem = () => {
        setFormData(prev => {
            const newItem = { id: Date.now() + '', time: '', duration: 10, activity: 'Nueva Actividad' };
            const newProgram = [...(prev.program || []), newItem];
            return recalculateProgramTimes({ ...prev, program: newProgram });
        });
    };

    const removeProgramItem = (index: number) => {
        setFormData(prev => {
            const newProgram = [...(prev.program || [])];
            newProgram.splice(index, 1);
            return recalculateProgramTimes({ ...prev, program: newProgram });
        });
    };
    // --------------------------

    const handleRoleChange = (role: string, value: string) => {
        // Store raw value but formatted as array for internal state structure compatibility
        // The simple fix is to just split by comma and NOT trim/filter yet so spaces are preserved
        const rawNames = value.split(',');
        setFormData(prev => ({
            ...prev,
            assignments: {
                ...(prev.assignments || {}),
                [role]: rawNames
            }
        }));
    };

    // ROLE MANAGEMENT
    const addCustomRole = () => {
        if (newRoleName.trim()) {
            setCustomRoles(prev => [...prev, newRoleName.trim()]);
            setNewRoleName('');
        }
    };
    const deleteCustomRole = (roleToDelete: string) => {
        if (confirm(`¿Borrar cargo "${roleToDelete}"?`)) {
            setCustomRoles(prev => prev.filter(r => r !== roleToDelete));
            // Also cleanup assignment data
            setFormData(prev => {
                const newAssignments = { ...prev.assignments };
                delete newAssignments[roleToDelete];
                return { ...prev, assignments: newAssignments };
            });
        }
    };
    const startEditRole = (index: number, currentName: string) => {
        setEditingRoleIndex(index);
        setEditingRoleValue(currentName);
    };
    const saveEditRole = (index: number) => {
        if (editingRoleValue.trim()) {
            const oldName = customRoles[index];
            const newName = editingRoleValue.trim();

            // Update List
            const newRoles = [...customRoles];
            newRoles[index] = newName;
            setCustomRoles(newRoles);

            // Transfer Assignment Data
            setFormData(prev => {
                const newAssignments = { ...prev.assignments };
                newAssignments[newName] = newAssignments[oldName] || [];
                delete newAssignments[oldName];
                return { ...prev, assignments: newAssignments };
            });
        }
        setEditingRoleIndex(null);
    };

    // RESOURCE MANAGEMENT
    const addCustomResource = () => {
        if (newResourceName.trim()) {
            setFormData(prev => ({
                ...prev,
                logistics: {
                    ...prev.logistics,
                    customResources: [...(prev.logistics?.customResources || []), newResourceName.trim()]
                }
            }));
            setNewResourceName('');
        }
    };
    const deleteCustomResource = (resource: string) => {
        if (confirm(`¿Borrar recurso "${resource}"?`)) {
            setFormData(prev => ({
                ...prev,
                logistics: {
                    ...prev.logistics,
                    customResources: prev.logistics?.customResources?.filter(r => r !== resource) || []
                }
            }));
        }
    };
    const startEditResource = (index: number, currentName: string) => {
        setEditingResourceIndex(index);
        setEditingResourceValue(currentName);
    };
    const saveEditResource = (index: number) => {
        if (editingResourceValue.trim()) {
            const oldName = formData.logistics?.customResources?.[index];
            if (!oldName) return;

            setFormData(prev => {
                const newResources = [...(prev.logistics?.customResources || [])];
                newResources[index] = editingResourceValue.trim();
                return {
                    ...prev,
                    logistics: { ...prev.logistics, customResources: newResources }
                };
            });
        }
        setEditingResourceIndex(null);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clean assignments before saving
        const cleanedAssignments: Record<string, string[]> = {};
        Object.entries(formData.assignments || {}).forEach(([role, names]) => {
            const cleanNames = (names as string[]).map(n => n.trim()).filter(Boolean);
            if (cleanNames.length > 0) {
                cleanedAssignments[role] = cleanNames;
            }
        });

        const newEvent: CalendarEvent = {
            id: initialEvent?.id || Date.now().toString(),
            createdAt: initialEvent?.createdAt || Date.now(),
            updatedAt: Date.now(),
            ...formData as CalendarEvent,
            assignments: cleanedAssignments,
            localId: formData.location // Sync location to localId
        };
        onSave(newEvent);
    };

    const handlePrint = () => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text(formData.title || 'Programa de Culto', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Fecha: ${formData.startDate?.replace('T', ' ')}`, 20, 35);
        doc.text(`Lugar: ${formData.location}`, 20, 42);
        doc.text(`Ministerio: ${formData.ministryId}`, 20, 49);

        // Logistics Summary in Print
        let yPos = 60;
        doc.setFontSize(14);
        doc.text("Resumen Logístico", 20, yPos);
        yPos += 8;
        doc.setFontSize(10);

        const keyText = formData.logistics?.keysRequired
            ? `Sí (Retira: ${formData.logistics.keyPickupPerson1 || 'No asignado'} / ${formData.logistics.keyPickupPerson2 || 'No asignado'})`
            : 'No requiere llaves';
        doc.text(`Retiro de Llaves: ${keyText}`, 20, yPos);
        yPos += 6;

        const resourcesList = [
            ...(formData.logistics?.customResources || [])
        ];

        doc.text(`Recursos: ${resourcesList.length > 0 ? resourcesList.join(', ') : 'Ninguno especificado'}`, 20, yPos);
        yPos += 15;

        // Roles Section (All Roles)
        doc.setFontSize(14);
        doc.text("Equipos y Encargados", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        const rolesData = Object.entries(formData.assignments || {})
            .filter(([_, names]) => (names as string[]).length > 0)
            .map(([role, names]) => [role, (names as string[]).join(', ')]);

        if (rolesData.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Rol / Función', 'Asignados']],
                body: rolesData,
                theme: 'striped',
                headStyles: { fillColor: [66, 66, 66] }
            });
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Program Section
        doc.setFontSize(14);
        doc.text("Liturgia - Orden del Culto", 20, yPos);
        yPos += 5;

        const programData = formData.program?.map(p => [p.time, `${p.duration} min`, p.activity, p.responsibleName || '', p.notes || '']) || [];

        autoTable(doc, {
            startY: yPos,
            head: [['Hora', 'Dur.', 'Actividad', 'Responsable', 'Notas']],
            body: programData,
            theme: 'grid',
            headStyles: { fillColor: [41, 98, 255] }
        });

        // Observations
        if (formData.observations) {
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(12);
            doc.text("Observaciones:", 20, yPos);
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(formData.observations, 170);
            doc.text(lines, 20, yPos + 7);
        }

        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDownloadICS = () => {
        const formatDate = (dateStr?: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        };

        const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
        const start = formatDate(formData.startDate);
        const end = formatDate(formData.endDate);

        const description = `Ministerio: ${formData.ministryId}\n\nPrograma:\n` +
            formData.program?.map(p => `- ${p.time} ${p.activity}`).join('\\n') +
            `\n\nObservaciones: ${formData.observations || ''}`;

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Ecclesia//App//ES",
            "BEGIN:VEVENT",
            `UID:${formData.id || Date.now()}@ecclesia.app`,
            `DTSTAMP:${now}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${formData.title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${formData.location}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${formData.title || 'evento'}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800">
                            {initialEvent ? 'Editar Evento / Culto' : 'Planificar Nuevo Evento'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Gestión integral de servicios y actividades</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-8 bg-white">
                    {['general', 'roles', 'program', 'logistics'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-4 transition-colors ${activeTab === tab
                                ? 'border-blue-600 text-blue-800 bg-blue-50/50'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {{ general: 'General', roles: 'Equipos y Encargados', program: 'Liturgia', logistics: 'Logística' }[tab]}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-end p-2">
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2"
                                    >
                                        🖨️ Imprimir / Exportar Todo
                                    </button>
                                </div>

                                <FormSection title="Información Básica">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Ministerio Responsable</Label>
                                            <select
                                                value={formData.ministryId}
                                                onChange={(e) => handleChange('ministryId', e.target.value)}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-semibold"
                                            >
                                                {OFFICIAL_MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Local / Ubicación</Label>
                                            <select
                                                value={formData.location}
                                                onChange={(e) => handleChange('location', e.target.value)}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-semibold"
                                            >
                                                <optgroup label="Locales Propios">
                                                    {DEFAULT_CHURCH_LOCALS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </optgroup>
                                                <optgroup label="Externos">
                                                    <option value="Corporación">Corporación</option>
                                                    <option value="Sector">Sector</option>
                                                    <option value="Comunal">Comunal</option>
                                                    <option value="Visita">Visita a otra Iglesia</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Conditional Address Field */}
                                    {(!DEFAULT_CHURCH_LOCALS.includes(formData.location || '') || ['Corporación', 'Sector', 'Comunal', 'Visita'].includes(formData.location || '')) && (
                                        <div className="space-y-2 animate-fadeIn">
                                            <Label>Dirección / Ubicación Detallada</Label>
                                            <input
                                                type="text"
                                                value={formData.address || ''}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 font-medium"
                                                placeholder="Calle, Número, Comuna..."
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Título del Evento</Label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleChange('title', e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-bold text-lg"
                                            placeholder="Ej: Culto de Santa Cena"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Inicio</Label>
                                            <input
                                                type="datetime-local"
                                                value={formData.startDate}
                                                onChange={(e) => {
                                                    handleChange('startDate', e.target.value);
                                                    recalculateProgramTimes({ ...formData, startDate: e.target.value });
                                                }}
                                                className="w-full p-3 rounded-xl border border-slate-200 font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fin</Label>
                                            <input
                                                type="datetime-local"
                                                value={formData.endDate}
                                                onChange={(e) => handleChange('endDate', e.target.value)}
                                                className="w-full p-3 rounded-xl border border-slate-200 font-mono text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                </FormSection>


                                <FormSection title="Observaciones Generales">
                                    <textarea
                                        value={formData.observations}
                                        onChange={(e) => handleChange('observations', e.target.value)}
                                        className="w-full p-3 rounded-xl border border-slate-200 min-h-[100px]"
                                        placeholder="Detalles importantes, instrucciones especiales..."
                                    />
                                </FormSection>
                            </div>
                        )}

                        {/* ROLES TAB */}
                        {activeTab === 'roles' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-4 text-sm text-yellow-800">
                                    💡 Asigna los nombres de los responsables. Puedes poner varios separados por coma.
                                </div>

                                {/* Custom Roles Adder */}
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="Nuevo cargo o rol..."
                                        className="flex-1 p-2 rounded-lg border border-slate-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomRole}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
                                    >
                                        + Agregar Cargo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {/* Standard Roles */}
                                    {EVENT_ROLES.map(role => (
                                        <div key={role} className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{role}</label>
                                            <input
                                                type="text"
                                                value={formData.assignments?.[role]?.join(', ') || ''}
                                                onChange={(e) => handleRoleChange(role, e.target.value)}
                                                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 shadow-sm"
                                                placeholder="Nombre(s)..."
                                            />
                                        </div>
                                    ))}

                                    {/* Custom Roles with Edit/Delete */}
                                    {customRoles.map((role, idx) => (
                                        <div key={role} className="space-y-1 group relative">
                                            <div className="flex justify-between items-center pr-2">
                                                {editingRoleIndex === idx ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editingRoleValue}
                                                        onChange={(e) => setEditingRoleValue(e.target.value)}
                                                        onBlur={() => saveEditRole(idx)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditRole(idx)}
                                                        className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-bold text-purple-600 uppercase tracking-widest">{role}</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditRole(idx, role)}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-blue-600"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteCustomRole(role)}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-600"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.assignments?.[role]?.join(', ') || ''}
                                                onChange={(e) => handleRoleChange(role, e.target.value)}
                                                className="w-full p-2 rounded-lg border border-purple-200 focus:ring-1 focus:ring-purple-500 shadow-sm bg-purple-50/10"
                                                placeholder="Nombre(s)..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PROGRAM TAB */}
                        {activeTab === 'program' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-bold text-slate-700">Liturgia Oficial</h3>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                            {formData.program?.reduce((acc, curr) => acc + curr.duration, 0)} mins total
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleDownloadICS}
                                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-all"
                                        >
                                            📅 Agregar a Calendar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addProgramItem}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all"
                                            title="Agregar nuevo bloque"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Templates Capsule */}
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">
                                        ✨ Cargar Plantilla de Liturgia
                                    </h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.keys(SERVICE_TEMPLATES).map(key => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => applyTemplate(key)}
                                                className="px-3 py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:shadow-md hover:bg-indigo-600 hover:text-white transition-all border border-indigo-200"
                                            >
                                                {key.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {formData.program?.length === 0 && (
                                        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                                            No hay bloques definidos. Usa una plantilla (Pestaña General) o agrega bloques manualmente.
                                        </div>
                                    )}
                                    {formData.program?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-start p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group relative">
                                            <div className="absolute -left-3 top-6 bg-slate-200 text-slate-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <div className="w-24 pt-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Hora Inicio</label>
                                                <input
                                                    type="text"
                                                    value={item.time}
                                                    onChange={(e) => updateProgramItem(idx, 'time', e.target.value)}
                                                    readOnly={idx !== 0}
                                                    className={`w-full p-2 text-lg font-mono font-bold text-slate-700 bg-slate-50 rounded border ${idx === 0 ? 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-text bg-white' : 'border-transparent cursor-default'}`}
                                                />
                                            </div>
                                            <div className="w-20 pt-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Minutos</label>
                                                <input
                                                    type="number"
                                                    value={item.duration}
                                                    onChange={(e) => updateProgramItem(idx, 'duration', parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 text-lg font-mono font-bold text-blue-600 bg-white rounded border border-slate-200 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2 pt-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Actividad y Detalles</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.activity}
                                                        onChange={(e) => updateProgramItem(idx, 'activity', e.target.value)}
                                                        className="flex-1 font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-blue-500 focus:ring-0 p-1 text-lg placeholder-slate-300 transition-colors"
                                                        placeholder="Nombre de la actividad"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.responsibleName || ''}
                                                        onChange={(e) => updateProgramItem(idx, 'responsibleName', e.target.value)}
                                                        className="w-full text-sm text-slate-600 bg-slate-50 rounded px-2 py-1 border-none placeholder-slate-400"
                                                        placeholder="Responsable del bloque..."
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.notes || ''}
                                                        onChange={(e) => updateProgramItem(idx, 'notes', e.target.value)}
                                                        className="w-full text-sm text-slate-500 bg-slate-50 rounded px-2 py-1 border-none placeholder-slate-400 italic"
                                                        placeholder="Notas técnicas..."
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeProgramItem(idx)}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all self-center"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LOGISTICS TAB */}
                        {activeTab === 'logistics' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Control de Llaves y Acceso</h3>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.logistics?.keysRequired}
                                            onChange={(e) => handleChange('logistics', { ...formData.logistics, keysRequired: e.target.checked })}
                                            className="w-6 h-6 text-blue-600 rounded-md focus:ring-blue-500"
                                            id="keysReq"
                                        />
                                        <label htmlFor="keysReq" className="font-bold text-slate-700">Requiere retiro de llaves</label>
                                    </div>

                                    {formData.logistics?.keysRequired && (
                                        <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Opción 1: Hno(a).</label>
                                                <input
                                                    type="text"
                                                    value={formData.logistics.keyPickupPerson1 || ''}
                                                    onChange={(e) => handleChange('logistics', { ...formData.logistics, keyPickupPerson1: e.target.value })}
                                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                                    placeholder="Nombre quien retira..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Opción 2: Hno(a).</label>
                                                <input
                                                    type="text"
                                                    value={formData.logistics.keyPickupPerson2 || ''}
                                                    onChange={(e) => handleChange('logistics', { ...formData.logistics, keyPickupPerson2: e.target.value })}
                                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                                    placeholder="Alternativa..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recursos Necesarios</h3>
                                    <div className="space-y-2">
                                        {/* Standard Resources */}
                                        {['Proyector', 'Sonido Portátil', 'Cafetería', 'Sillas Adicionales', 'Mesas', 'Mantelería']
                                            .filter(r => !formData.logistics?.customResources?.includes(r)) // Don't show if accidentally in custom list
                                            .map(resource => (
                                                <div key={resource} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            const current = formData.logistics?.customResources || [];
                                                            const updated = e.target.checked
                                                                ? [...current, resource]
                                                                : current.filter(r => r !== resource);
                                                            handleChange('logistics', { ...formData.logistics, customResources: updated });
                                                        }}
                                                        checked={formData.logistics?.customResources?.includes(resource)}
                                                        className="w-5 h-5 text-indigo-600 rounded"
                                                    />
                                                    <span className="font-semibold text-slate-600">{resource}</span>
                                                </div>
                                            ))}

                                        {/* Render created/custom/selected resources with Edit/Delete */}
                                        {formData.logistics?.customResources?.map((resource, idx) => {
                                            const isStandard = ['Proyector', 'Sonido Portátil', 'Cafetería', 'Sillas Adicionales', 'Mesas', 'Mantelería'].includes(resource);
                                            return (
                                                <div key={`res-${idx}`} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100 group">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        onChange={() => {
                                                            // Toggle off just removes it
                                                            const updated = (formData.logistics?.customResources || []).filter(r => r !== resource);
                                                            handleChange('logistics', { ...formData.logistics, customResources: updated });
                                                        }}
                                                        className="w-5 h-5 text-indigo-600 rounded"
                                                    />

                                                    {editingResourceIndex === idx ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={editingResourceValue}
                                                            onChange={(e) => setEditingResourceValue(e.target.value)}
                                                            onBlur={() => saveEditResource(idx)}
                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditResource(idx)}
                                                            className="flex-1 p-1 text-sm border-b border-blue-500 focus:outline-none bg-transparent"
                                                        />
                                                    ) : (
                                                        <span className={`font-semibold ml-2 flex-1 ${!isStandard ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {resource} {!isStandard && '(Personalizado)'}
                                                        </span>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {!isStandard && (
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditResource(idx, resource)}
                                                                className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-blue-600"
                                                            >
                                                                ✏️
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteCustomResource(resource)}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-500"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                                        <input
                                            type="text"
                                            value={newResourceName}
                                            onChange={(e) => setNewResourceName(e.target.value)}
                                            placeholder="Otro recurso..."
                                            className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomResource}
                                            className="px-4 py-2 bg-slate-600 text-white rounded-lg text-xs font-bold"
                                        >
                                            + Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-200 bg-white flex justify-between items-center z-10">
                    {initialEvent && onDelete ? (
                        <button
                            type="button"
                            onClick={() => { if (confirm('¿Eliminar evento?')) onDelete(initialEvent.id); }}
                            className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            Eliminar Evento
                        </button>
                    ) : <div></div>}

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transform hover:-translate-y-0.5 transition-all"
                        >
                            Guardar Planificación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Helpers
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</label>
);

const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">{title}</h3>
        {children}
    </div>
);
