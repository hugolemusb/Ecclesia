import { CleaningScheduleItem, CleaningExportConfig } from '../../../../types/cleaning';
import { getRandomVerse } from '../../../../services/bibleVerses';

export const exportToTXT = (
  schedule: CleaningScheduleItem[],
  config: CleaningExportConfig,
  currentMonth: Date
) => {
  const monthYear = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const verse = getRandomVerse();
  
  let content = '================================================================================\n';
  content += 'PROGRAMACION DE ASEO DEL TEMPLO\n';
  content += (config.churchName || 'IGLESIA EVANGELICA') + '\n';
  content += '================================================================================\n\n';

  if (config.includeHeader) {
    if (config.address) content += 'Direccion: ' + config.address + '\n';
    if (config.phone) content += 'Telefono: ' + config.phone + '\n';
    if (config.pastor) content += 'Pastor: ' + config.pastor + '\n';
    content += 'Mes: ' + monthYear + '\n';
    content += 'Generado: ' + new Date().toLocaleDateString('es-ES') + '\n\n';
    content += '================================================================================\n\n';
  }

  // Ordenar cronológicamente
  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentWeek = 0;
  sortedSchedule.forEach((item, idx) => {
    if (item.weekNumber !== currentWeek) {
      content += '\n';
      content += 'SEMANA ' + item.weekNumber + ' - ' + monthYear + '\n';
      content += '--------------------------------------------------------------------------------\n\n';
      currentWeek = item.weekNumber;
    }
    
    content += 'FECHA: ' + new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) + '\n';
    content += 'SERVICIO: ' + item.service + ' - ' + item.serviceTime + '\n';
    content += '--------------------------------------------------------------------------------\n';
    
    if (item.absence) {
      const replacementGroup = item.absence.replacementGroup || item.group;
      const replacementMembers = item.absence.replacementMembers.length > 0 
        ? item.absence.replacementMembers 
        : replacementGroup.members;
      
      content += 'CAMBIO DE GRUPO\n';
      content += '   Motivo: ' + item.absence.reason + '\n';
      content += '   Grupo Original (Ausente): ' + item.group.name + '\n\n';
      content += 'GRUPO REEMPLAZO: ' + replacementGroup.name + '\n';
      content += '   Coordinador: ' + replacementGroup.coordinator + '\n';
      content += '   Telefono: ' + replacementGroup.phone + '\n';
      content += '   Llaves: ' + replacementGroup.keyHolder + '\n';
      content += '   Horario: ' + replacementGroup.preferredTime + '\n';
      content += '   Miembros:\n';
      replacementMembers.forEach(member => {
        content += '      - ' + member + '\n';
      });
    } else {
      content += 'GRUPO RESPONSABLE: ' + item.group.name + '\n';
      content += '   Coordinador: ' + item.group.coordinator + '\n';
      content += '   Telefono: ' + item.group.phone + '\n';
      content += '   Llaves: ' + item.group.keyHolder + '\n';
      content += '   Horario: ' + item.group.preferredTime + '\n';
      content += '   Miembros:\n';
      item.group.members.forEach(member => {
        content += '      - ' + member + '\n';
      });
    }
    content += '\n';
  });

  if (config.includeFooter) {
    content += '\n================================================================================\n';
    content += '\nVERSICULO DEL MES:\n';
    content += '"' + verse.text + '"\n';
    content += '- ' + verse.reference + '\n\n';
    
    if (config.additionalNotes) {
      content += 'NOTAS IMPORTANTES:\n' + config.additionalNotes + '\n\n';
    }
    
    content += 'INSTRUCCIONES GENERALES:\n';
    content += '   - Llegar puntualmente al horario indicado\n';
    content += '   - Verificar limpieza completa antes de retirarse\n';
    content += '   - Encargado de llaves abre y cierra el templo\n';
    content += '   - Reportar cualquier dano o necesidad\n\n';
    content += '================================================================================\n';
    content += 'Sistema Ecclesia | Gestion de Aseo del Templo\n';
    content += '================================================================================\n';
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = 'aseo-' + (config.churchName.replace(/\s+/g, '-') || 'templo') + '-' + 
                   (currentMonth.getMonth() + 1) + '-' + currentMonth.getFullYear() + '.txt';
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
