import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ServiceTemplate, ServiceType } from '../../../types/services';
import { SERVICE_TYPE_LABELS } from '../../../services/servicesData';

interface TemplateModalProps {
  template?: ServiceTemplate;
  onSave: (template: ServiceTemplate) => void;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'otro',
    tags: template?.tags.join(', ') || '',
    color: template?.color || '#4A90E2',
    icon: template?.icon || 'Calendar',
    defaultDuration: template?.defaultDuration || 120,
  });

  const iconNames = ['Calendar', 'Church', 'Sun', 'Moon', 'Heart', 'Users', 'Gift', 'Flag', 'Sparkles'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTemplate: ServiceTemplate = {
      id: template?.id || `template-custom-${Date.now()}`,
      name: formData.name,
      type: formData.type as ServiceType,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      color: formData.color,
      icon: formData.icon,
      defaultDuration: formData.defaultDuration,
      isDefault: false,
      fields: [],
      createdAt: template?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    onSave(newTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Culto Especial"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Etiquetas</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="culto, especial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (min)</label>
              <input
                type="number"
                required
                min="15"
                value={formData.defaultDuration}
                onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {template ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
