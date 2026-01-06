
import React, { useState, useEffect } from 'react';
import { CalendarEvent, Person } from '../../../types';
import { CALENDAR_EVENT_TYPES } from '../../../constants';
import { default as DatePicker } from 'react-datepicker'; // Assuming installed or use native date input? 
// Actually, native date input is safer if I didn't install react-datepicker. 
// I only installed date-fns. I will use native inputs for now to avoid breaking.
// <input type="datetime-local" />

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete?: (eventId: string) => void;
    initialEvent?: CalendarEvent | null;
    selectedDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, initialEvent, selectedDate }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        title: '',
        type: 'internal',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        description: '',
        location: '',
        color: '#3B82F6',
        status: 'scheduled'
    });

    useEffect(() => {
        if (initialEvent) {
            setFormData({
                ...initialEvent,
                startDate: initialEvent.startDate || initialEvent.date + 'T' + initialEvent.time, // Backwards compat
                endDate: initialEvent.endDate || initialEvent.date + 'T' + (initialEvent.endTime || '23:59'),
            });
        } else if (selectedDate) {
            const start = selectedDate.toISOString().slice(0, 10) + 'T09:00';
            const end = selectedDate.toISOString().slice(0, 10) + 'T10:00';
            setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
        }
    }, [initialEvent, selectedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto color update logic
        if (name === 'type') {
            const typeObj = CALENDAR_EVENT_TYPES.find(t => t.value === value);
            if (typeObj) {
                setFormData(prev => ({ ...prev, color: typeObj.color }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.startDate || !formData.endDate) return;

        // Construct full event object
        const newEvent: CalendarEvent = {
            id: initialEvent?.id || Date.now().toString(),
            createdAt: initialEvent?.createdAt || Date.now(),
            updatedAt: Date.now(),
            title: formData.title!,
            type: formData.type as any,
            startDate: formData.startDate!,
            endDate: formData.endDate!,
            description: formData.description,
            location: formData.location,
            color: formData.color,
            status: formData.status as any || 'scheduled',
            // Legacy support
            date: formData.startDate!.split('T')[0],
            time: formData.startDate!.split('T')[1],
        };

        onSave(newEvent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold font-heading">{initialEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            >
                                {CALENDAR_EVENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Color</label>
                            <input
                                type="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Inicio</label>
                            <input
                                type="datetime-local"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fin</label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción / Notas</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        {initialEvent && onDelete && (
                            <button
                                type="button"
                                onClick={() => { if (confirm("¿Seguro que desea eliminar?")) onDelete(initialEvent.id); }}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 mr-auto"
                            >
                                Eliminar
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
