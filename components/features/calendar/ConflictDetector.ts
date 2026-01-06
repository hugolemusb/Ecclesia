
import { CalendarEvent } from '../../../types';
import { areIntervalsOverlapping, parseISO } from 'date-fns';

export interface ConflictResult {
    hasConflict: boolean;
    messages: string[];
    type: 'space' | 'person' | 'resource' | 'none';
}

export const detectConflicts = (newEvent: CalendarEvent, allEvents: CalendarEvent[]): ConflictResult => {
    const messages: string[] = [];
    let type: ConflictResult['type'] = 'none';

    // Filter out the event itself (in case of edit)
    const otherEvents = allEvents.filter(e => e.id !== newEvent.id);

    const newStart = typeof newEvent.startDate === 'string' ? parseISO(newEvent.startDate) : newEvent.startDate;
    const newEnd = typeof newEvent.endDate === 'string' ? parseISO(newEvent.endDate) : newEvent.endDate;

    if (!newStart || !newEnd) return { hasConflict: false, messages: [], type: 'none' };

    for (const existing of otherEvents) {
        const existingStart = typeof existing.startDate === 'string' ? parseISO(existing.startDate) : existing.startDate;
        const existingEnd = typeof existing.endDate === 'string' ? parseISO(existing.endDate) : existing.endDate;

        // Check time overlap
        if (areIntervalsOverlapping({ start: newStart, end: newEnd }, { start: existingStart, end: existingEnd })) {

            // 1. Space Conflict (Same Local)
            if (existing.localId === newEvent.localId && newEvent.localId !== 'Externo') {
                messages.push(`⛔ Conflicto de Espacio: El local "${newEvent.localId}" ya está ocupado por el evento "${existing.title}" en este horario.`);
                type = 'space';
            }

            // 2. Person Conflict (Same Responsible) behavior not fully implemented yet as we primarily use strings for now, 
            // but structure is ready.
            if (existing.responsibleId && newEvent.responsibleId && existing.responsibleId === newEvent.responsibleId) {
                messages.push(`⚠️ Sobrecarga: El responsable ya tiene asignado el evento "${existing.title}" a la misma hora.`);
                type = 'person';
            }
        }
    }

    return {
        hasConflict: messages.length > 0,
        messages,
        type
    };
};
