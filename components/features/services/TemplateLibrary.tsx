import React, { useState, useEffect } from 'react';
import { ServiceTemplate } from '../../../types/services';
import { DEFAULT_SERVICE_TEMPLATES } from '../../../services/servicesData';
import { TemplateCard } from './TemplateCard';
import { TemplateModal } from './TemplateModal';
import { Plus, Search, Filter } from 'lucide-react';

interface TemplateLibraryProps {
  onTemplateSelect: (template: ServiceTemplate) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | undefined>();

  useEffect(() => {
    const savedTemplates = localStorage.getItem('customServiceTemplates');
    const customTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
    setTemplates([...DEFAULT_SERVICE_TEMPLATES, ...customTemplates]);
  }, []);

  const handleEdit = (template: ServiceTemplate) => {
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta plantilla?')) {
      const updated = templates.filter(t => t.id !== id);
      const customOnly = updated.filter(t => !t.isDefault);
      setTemplates([...DEFAULT_SERVICE_TEMPLATES, ...customOnly]);
      localStorage.setItem('customServiceTemplates', JSON.stringify(customOnly));
    }
  };

  const handleDuplicate = (template: ServiceTemplate) => {
    const newTemplate: ServiceTemplate = {
      ...template,
      id: `template-custom-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isDefault: false,
      createdAt: new Date(),
    };
    const customTemplates = templates.filter(t => !t.isDefault);
    const updated = [...customTemplates, newTemplate];
    setTemplates([...DEFAULT_SERVICE_TEMPLATES, ...updated]);
    localStorage.setItem('customServiceTemplates', JSON.stringify(updated));
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => t.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(templates.flatMap(t => t.tags))).sort();

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Plantillas</h2>
          <button
            onClick={() => {
              setEditingTemplate(undefined);
              setShowCreateModal(true);
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus size={16} />
            Nueva
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200 max-h-24 overflow-y-auto">
        <div className="flex items-center gap-1 mb-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">Filtrar por etiqueta:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                );
              }}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredTemplates.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            No se encontraron plantillas
          </p>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 text-center">
        Arrastra una plantilla al calendario para crear un nuevo servicio
      </div>

      {showCreateModal && (
        <TemplateModal
          template={editingTemplate}
          onSave={(template) => {
            if (editingTemplate) {
              const updated = templates.map(t => t.id === template.id ? template : t);
              const customOnly = updated.filter(t => !t.isDefault);
              setTemplates(updated);
              localStorage.setItem('customServiceTemplates', JSON.stringify(customOnly));
            } else {
              const customTemplates = templates.filter(t => !t.isDefault);
              const updated = [...customTemplates, template];
              setTemplates([...DEFAULT_SERVICE_TEMPLATES, ...updated]);
              localStorage.setItem('customServiceTemplates', JSON.stringify(updated));
            }
            setShowCreateModal(false);
            setEditingTemplate(undefined);
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(undefined);
          }}
        />
      )}
    </div>
  );
};
