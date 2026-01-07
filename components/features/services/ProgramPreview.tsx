import React, { useRef } from 'react';
import { X, Calendar, Clock, User, Music, Book, Users, FileText, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ServiceProgram } from '../../../types/services';
import { generatePDF, printProgram } from './exports/PDFExporter';
import './exports/PrintView.css';

interface ProgramPreviewProps {
  program: ServiceProgram;
  onClose: () => void;
  onEdit: () => void;
}

export const ProgramPreview: React.FC<ProgramPreviewProps> = ({ program, onClose, onEdit }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const worshipData = program.sections.find(s => s.type === 'worship')?.data || { leader: '', songs: [] };
  const liturgyData = program.sections.find(s => s.type === 'liturgy')?.data || {};
  const assignmentsData = program.sections.find(s => s.type === 'assignments')?.data || { assignments: [] };
  const notesData = program.sections.find(s => s.type === 'notes')?.data || { content: '' };
  const generalData = program.sections.find(s => s.type === 'general')?.data || {};

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  const handleDownloadPDF = async () => {
    if (printRef.current) {
      const success = await generatePDF(program, printRef.current);
      if (!success) {
        alert('Error al generar el PDF. Por favor, intenta nuevamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 no-print">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{program.title}</h2>
            <div className="flex items-center gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {format(program.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {program.time}
                {generalData.endTime && ` - ${generalData.endTime}`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[program.status]}`}>
                {statusLabels[program.status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold flex items-center gap-2"
              title="Descargar PDF"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={printProgram}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold flex items-center gap-2"
              title="Imprimir"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
            >
              Editar
            </button>
            <button onClick={onClose} className="p-2 hover:bg-blue-800 rounded-lg text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Optimizado para impresión */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 space-y-6 print-content">
          {/* Header para impresión */}
          <div className="program-header hidden print:block">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.title}</h1>
            <p className="text-lg text-gray-700">
              {format(program.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <p className="text-md text-gray-600">
              Hora: {program.time}{generalData.endTime && ` - ${generalData.endTime}`}
            </p>
          </div>

          {/* General Info */}
          <div className="program-section">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User size={20} className="text-blue-600 no-print" />
              Información General
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Ministro(s):</p>
                <p className="text-gray-800">{program.minister || <span className="italic text-gray-400">Sin asignar</span>}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Estado:</p>
                <p className="text-gray-800">{statusLabels[program.status]}</p>
              </div>
            </div>
          </div>

          {/* Worship Section */}
          <div className="border-t pt-6 program-section">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Music size={20} className="text-blue-600 no-print" />
              Adoración
            </h3>
            {worshipData.leader && (
              <p className="text-sm text-gray-600 mb-3">
                <strong>Líder:</strong> {worshipData.leader}
              </p>
            )}
            {!worshipData.leader && (
              <p className="text-sm text-gray-400 italic mb-3">Líder sin asignar</p>
            )}
            
            {worshipData.songs && worshipData.songs.length > 0 ? (
              <>
                <div className="space-y-2">
                  {worshipData.songs.map((song: any, idx: number) => (
                    <div key={song.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold no-print">
                        {idx + 1}
                      </span>
                      <span className="font-bold print:inline hidden">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{song.name}</p>
                        {song.artist && <p className="text-sm text-gray-600">{song.artist}</p>}
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          {song.key && <span>Tono: {song.key}</span>}
                          {song.duration && <span>{song.duration} min</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800 font-semibold">
                  ⏱️ Tiempo total: {worshipData.songs.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)} minutos
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay canciones añadidas</p>
            )}
          </div>

          {/* Liturgy Section */}
          <div className="border-t pt-6 program-section">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Book size={20} className="text-blue-600 no-print" />
              Liturgia
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-1">Lectura Bíblica:</p>
                {liturgyData.scripture?.book ? (
                  <p className="text-gray-800 font-medium">
                    {liturgyData.scripture.book} {liturgyData.scripture.chapter}
                    {liturgyData.scripture.versesStart && `:${liturgyData.scripture.versesStart}`}
                    {liturgyData.scripture.versesEnd && `-${liturgyData.scripture.versesEnd}`}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Sin asignar</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Oración de Apertura:</p>
                  <p className="text-gray-800">{liturgyData.prayerOpening || <span className="italic text-gray-400">Sin asignar</span>}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Oración de Cierre:</p>
                  <p className="text-gray-800">{liturgyData.prayerClosing || <span className="italic text-gray-400">Sin asignar</span>}</p>
                </div>
              </div>

              {liturgyData.minister && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Predicador/Guía:</p>
                  <p className="text-gray-800">{liturgyData.minister}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-semibold text-gray-700">Tipo de Mensaje:</p>
                <p className="text-gray-800">{liturgyData.sermonType || 'Sermón'}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-700">Tema:</p>
                <p className="text-gray-800">{liturgyData.sermonTheme || <span className="italic text-gray-400">Sin definir</span>}</p>
              </div>
              
              {liturgyData.keyVerse && (
                <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Versículo Clave:</p>
                  <p className="text-gray-800 italic">"{liturgyData.keyVerse}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignments Section */}
          <div className="border-t pt-6 program-section">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users size={20} className="text-blue-600 no-print" />
              Asignaciones
            </h3>
            {assignmentsData.assignments && assignmentsData.assignments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {assignmentsData.assignments.map((assignment: any, idx: number) => {
                  const people = assignment.person ? assignment.person.split(',').map((p: string) => p.trim()) : [];
                  return (
                    <div key={idx} className="p-2 bg-gray-50 rounded">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{assignment.roleId}</p>
                      <div className="flex flex-wrap gap-1">
                        {people.map((person: string, pIdx: number) => (
                          <span key={pIdx} className="person-chip text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {person}
                          </span>
                        ))}
                        {people.length === 0 && <span className="text-gray-400 italic text-sm">Sin asignar</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay asignaciones definidas</p>
            )}
          </div>

          {/* Notes Section */}
          <div className="border-t pt-6 program-section">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-blue-600 no-print" />
              Notas
            </h3>
            {notesData.content ? (
              <div 
                className="prose max-w-none p-4 bg-gray-50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: notesData.content }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">Sin notas adicionales</p>
            )}
          </div>

          {/* Footer para impresión */}
          <div className="program-footer hidden print:block">
            <p className="text-xs">
              Generado el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm")} • Versión {program.version}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center no-print">
          <div className="text-xs text-gray-500">
            Creado: {format(program.createdAt, "dd/MM/yyyy HH:mm")} • 
            Versión: {program.version}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
            >
              Cerrar
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Editar Programa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
