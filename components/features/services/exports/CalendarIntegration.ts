import { CleaningScheduleItem } from '../../../../../types/cleaning';
import { db } from '../../../../../db';

export const exportToEcclesiaCalendar = async (schedule: CleaningScheduleItem[]) => {
  try {
    const state = await db.loadAll();
    
    // Convert cleaning schedule to CalendarEvents
    const cleaningEvents = schedule.map(item => ({
      id: `cleaning-${item.id}`,
      title: `🧹 Aseo - ${item.group.name}`,
      description: `Grupo de aseo responsable\n\nCoordinador: ${item.group.coordinator}\nTeléfono: ${item.group.phone}\nEncargado llaves: ${item.group.keyHolder}\nHorario: ${item.group.preferredTime}\n\nMiembros:\n${item.group.members.join('\n')}${item.absence ? '\n\n⚠️ REEMPLAZO: ' + item.absence.reason : ''}`,
      type: 'other' as const,
      startDate: new Date(item.date + 'T' + item.serviceTime).toISOString(),
      endDate: new Date(item.date + 'T' + item.serviceTime).toISOString(),
      location: item.service,
      responsibleId: undefined,
      assignedPeopleIds: []
    }));

    // Merge with existing events, avoiding duplicates
    const existingEventIds = new Set(state.events.map(e => e.id));
    const newEvents = cleaningEvents.filter(e => !existingEventIds.has(e.id));

    await db.saveAll({
      ...state,
      events: [...state.events, ...newEvents]
    });

    return {
      success: true,
      count: newEvents.length,
      message: `${newEvents.length} eventos de aseo añadidos al calendario`
    };
  } catch (error) {
    console.error('Error exporting to calendar:', error);
    return {
      success: false,
      count: 0,
      message: 'Error al exportar al calendario'
    };
  }
};
