import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Plus, Edit2, Trash2, Calendar, Clock, Eye } from 'lucide-react';
import { ServiceProgram, ServiceTemplate } from '../../../types/services';
import { ServiceModal } from './ServiceModal';
import { ProgramEditor } from './ProgramEditor';
import { ProgramPreview } from './ProgramPreview';

interface DayViewProps {
  date: Date;
  programs: ServiceProgram[];
  allPrograms: ServiceProgram[];
  onClose: () => void;
  onProgramsChange: (programs: ServiceProgram[]) => void;
}

export const DayView: React.FC<DayViewProps> = ({ date, programs, allPrograms, onClose, onProgramsChange }) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceProgram | undefined>();
  const [showProgramEditor, setShowProgramEditor] = useState(false);
  const [showProgramPreview, setShowProgramPreview] = useState(false);
  const [previewingService, setPreviewingService] = useState<ServiceProgram | undefined>();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'SERVICE_TEMPLATE',
    drop: (item: ServiceTemplate) => {
      handleCreateFromTemplate(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const handleCreateFromTemplate = (template: ServiceTemplate) => {
    const newProgram: ServiceProgram = {
      id: `program-${Date.now()}`,
      templateId: template.id,
      date: date,
      time: '10:00',
      title: template.name,
      minister: '',
      status: 'pending',
      sections: [],
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    
    const updatedPrograms = [...allPrograms, newProgram];
    onProgramsChange(updatedPrograms);
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm('¿Eliminar este servicio?')) {
      const updated = allPrograms.filter(p => p.id !== id);
      onProgramsChange(updated);
    }
  };

  const handleEditProgram = (program: ServiceProgram) => {
    setEditingService(program);
    setShowProgramEditor(true);
  };

  const handleViewProgram = (program: ServiceProgram) => {
    setPreviewingService(program);
    setShowProgramPreview(true);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </h2>
            <p className="text-sm text-gray-500">
              {programs.length} servicio{programs.length !== 1 ? 's' : ''} programado{programs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      <div
        ref={drop}
        className={`flex-1 overflow-y-auto p-4 ${
          isOver && canDrop ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
        }`}
      >
        {programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Calendar className="text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-2">No hay servicios programados</p>
            <p className="text-gray-400 text-sm">
              Arrastra una plantilla aquí o haz clic en "Nuevo Servicio"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(program => (
              <div key={program.id} className="p-4 border-2 border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => handleViewProgram(program)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">{program.time}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          program.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          program.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          program.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {program.status === 'confirmed' ? 'Confirmado' :
                         program.status === 'completed' ? 'Completado' :
                         program.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1 hover:text-blue-600">
                      {program.title}
                    </h3>
                    {program.minister && (
                      <p className="text-sm text-gray-600">Ministro: {program.minister}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Haz clic para ver detalles completos
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleViewProgram(program)} 
                      className="p-2 hover:bg-green-50 rounded-lg" 
                      title="Ver Programa Completo"
                    >
                      <Eye size={16} className="text-green-600" />
                    </button>
                    <button 
                      onClick={() => handleEditProgram(program)} 
                      className="p-2 hover:bg-blue-50 rounded-lg" 
                      title="Editar Programa"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProgram(program.id)} 
                      className="p-2 hover:bg-red-50 rounded-lg" 
                      title="Eliminar"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          Volver al calendario
        </button>
        <button
          onClick={() => setShowServiceModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nuevo Servicio
        </button>
      </div>

      {showServiceModal && (
        <ServiceModal
          service={editingService}
          date={date}
          onSave={(service) => {
            if (editingService) {
              const updated = allPrograms.map(p => p.id === service.id ? service : p);
              onProgramsChange(updated);
            } else {
              onProgramsChange([...allPrograms, service]);
            }
            setShowServiceModal(false);
            setEditingService(undefined);
          }}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(undefined);
          }}
        />
      )}

      {showProgramEditor && editingService && (
        <ProgramEditor
          program={editingService}
          onSave={(updatedProgram) => {
            const updated = allPrograms.map(p => p.id === updatedProgram.id ? updatedProgram : p);
            onProgramsChange(updated);
            setShowProgramEditor(false);
            setEditingService(undefined);
          }}
          onClose={() => {
            setShowProgramEditor(false);
            setEditingService(undefined);
          }}
        />
      )}

      {showProgramPreview && previewingService && (
        <ProgramPreview
          program={previewingService}
          onClose={() => {
            setShowProgramPreview(false);
            setPreviewingService(undefined);
          }}
          onEdit={() => {
            setEditingService(previewingService);
            setShowProgramPreview(false);
            setShowProgramEditor(true);
          }}
        />
      )}
    </div>
  );
};
