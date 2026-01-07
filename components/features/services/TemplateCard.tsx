import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { ServiceTemplate } from '../../../types/services';
import { Calendar, Edit2, Trash2, Copy, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';

interface TemplateCardProps {
    template: ServiceTemplate;
    onEdit: (template: ServiceTemplate) => void;
    onDelete: (id: string) => void;
    onDuplicate: (template: ServiceTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete, onDuplicate }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'SERVICE_TEMPLATE',
        item: { ...template },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // Dynamically get icon component
    const IconComponent = (Icons as any)[template.icon] || Calendar;

    return (
        <div
            ref={drag}
            className={`p-3 rounded-lg border-2 cursor-move transition-all ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-md'
                }`}
            style={{ borderColor: template.color, backgroundColor: `${template.color}10` }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <IconComponent size={20} style={{ color: template.color }} />
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-800">{template.name}</h4>
                        <p className="text-xs text-gray-500">{template.defaultDuration} min</p>
                    </div>
                </div>

                {!template.isDefault && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Editar"
                        >
                            <Edit2 size={14} className="text-gray-600" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(template); }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Duplicar"
                        >
                            <Copy size={14} className="text-gray-600" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Eliminar"
                        >
                            <Trash2 size={14} className="text-red-600" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 flex items-center gap-1">
                        <Tag size={10} />
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};
