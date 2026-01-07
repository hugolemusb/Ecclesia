import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ServiceProgram } from '../../../types/services';
import { DEFAULT_SERVICE_TEMPLATES } from '../../../services/servicesData';

interface ServiceModalProps {
  service?: ServiceProgram;
  date: Date;
  onSave: (service: ServiceProgram) => void;
  onClose: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ service, date, onSave, onClose }) => {
  const templates = DEFAULT_SERVICE_TEMPLATES;
  const customTemplates = JSON.parse(localStorage.getItem('customServiceTemplates') || '[]');
  const allTemplates = [...templates, ...customTemplates];

  const [selectedTemplate, setSelectedTemplate] = useState(service?.templateId || '');
  const [formData, setFormData] = useState({
    title: service?.title || '',
    date: service?.date ? format(service.date, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd'),
    time: service?.time || '10:00',
    endTime: service?.sections.find(s => s.type === 'general')?.data?.endTime || '',
    minister: service?.minister || '',
    status: service?.status || 'pending',
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = allTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        title: template.name,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newService: ServiceProgram = {
      id: service?.id || `program-${Date.now()}`,
      templateId: selectedTemplate || 'custom',
      date: new Date(formData.date),
      time: formData.time,
      title: formData.title,
      minister: formData.minister,
      status: formData.status as any,
      sections: service?.sections || [
        { id: `section-general-${Date.now()}`, type: 'general', data: { endTime: formData.endTime } }
      ],
      createdBy: 'current-user',
      createdAt: service?.createdAt || new Date(),
      updatedAt: new Date(),
      version: (service?.version || 0) + 1,
    };
    
    onSave(newService);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {service ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selection */}
          {!service && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Copy size={16} className="text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">
                  Seleccionar Plantilla (Opcional)
                </label>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Crear servicio personalizado --</option>
                <optgroup label="Plantillas Predefinidas">
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                {customTemplates.length > 0 && (
                  <optgroup label="Plantillas Personalizadas">
                    {customTemplates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Selecciona una plantilla para prellenar el título y configuración
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Servicio *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Culto Dominical"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha *</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Inicio *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Término</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ministro / Predicador</label>
            <input
              type="text"
              value={formData.minister}
              onChange={(e) => setFormData({ ...formData, minister: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Nombre del ministro"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes editar detalles completos del programa después de crearlo
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {service ? 'Guardar Cambios' : 'Crear Servicio'}
            </button>
          </div>
        </form>

        {!service && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Después de crear el servicio, haz clic en el ícono de editar (✏️) para acceder al editor completo con todas las secciones: Adoración, Liturgia, Asignaciones y Notas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
