import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ServiceProgram } from '../../../types/services';
import { WorshipSection } from './sections/WorshipSection';
import { LiturgySection } from './sections/LiturgySection';
import { AssignmentsSection } from './sections/AssignmentsSection';
import { RichTextEditor } from './editors/RichTextEditor';
import { SAMPLE_MEMBERS } from '../../../services/rolesData';

interface ProgramEditorProps {
  program: ServiceProgram;
  onSave: (program: ServiceProgram) => void;
  onClose: () => void;
}

export const ProgramEditor: React.FC<ProgramEditorProps> = ({ program, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [programData, setProgramData] = useState(program);
  const [hasChanges, setHasChanges] = useState(false);
  const [ministers, setMinisters] = useState<string[]>(
    program.minister ? program.minister.split(', ') : []
  );
  const [newMinister, setNewMinister] = useState('');
  const [endTime, setEndTime] = useState(
    program.sections.find(s => s.type === 'general')?.data?.endTime || ''
  );

  const worshipData = programData.sections.find(s => s.type === 'worship')?.data || { leader: '', songs: [] };
  const liturgyData = programData.sections.find(s => s.type === 'liturgy')?.data || {
    scripture: { book: '', chapter: 0, versesStart: 0 },
    prayerOpening: '',
    prayerClosing: '',
    sermonTheme: '',
    sermonType: 'Sermón',
    keyVerse: ''
  };
  const assignmentsData = programData.sections.find(s => s.type === 'assignments')?.data || { assignments: [] };
  const notesData = programData.sections.find(s => s.type === 'notes')?.data || { content: '' };

  const updateSection = (type: string, data: any) => {
    const existingSection = programData.sections.find(s => s.type === type);
    const updatedSections = existingSection
      ? programData.sections.map(s => s.type === type ? { ...s, data } : s)
      : [...programData.sections, { id: `section-${type}-${Date.now()}`, type, data }];
    
    setProgramData({ ...programData, sections: updatedSections });
    setHasChanges(true);
  };

  const addMinister = () => {
    if (newMinister.trim()) {
      setMinisters([...ministers, newMinister.trim()]);
      setNewMinister('');
      setHasChanges(true);
    }
  };

  const removeMinister = (index: number) => {
    setMinisters(ministers.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = () => {
    const ministerString = ministers.join(', ');
    updateSection('general', { endTime });
    onSave({ 
      ...programData, 
      minister: ministerString,
      updatedAt: new Date(), 
      version: programData.version + 1 
    });
    setHasChanges(false);
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'worship', label: 'Adoración' },
    { id: 'liturgy', label: 'Liturgia' },
    { id: 'assignments', label: 'Asignaciones' },
    { id: 'notes', label: 'Notas' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Editor de Programa</h2>
            <p className="text-sm text-gray-600">{program.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && <span className="text-xs text-yellow-600 font-semibold">● No guardado</span>}
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Save size={16} />
              Guardar
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Servicio *</label>
                <input
                  type="text"
                  value={programData.title}
                  onChange={(e) => {
                    setProgramData({ ...programData, title: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={format(programData.date, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      setProgramData({ ...programData, date: new Date(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    value={programData.time}
                    onChange={(e) => {
                      setProgramData({ ...programData, time: e.target.value });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Término</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <select
                  value={programData.status}
                  onChange={(e) => {
                    setProgramData({ ...programData, status: e.target.value as any });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ministro / Predicador / Guía / Líder
                </label>
                
                {ministers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ministers.map((minister, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {minister}
                        <button
                          onClick={() => removeMinister(idx)}
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !ministers.includes(e.target.value)) {
                        setMinisters([...ministers, e.target.value]);
                        setHasChanges(true);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar de la lista...</option>
                    {SAMPLE_MEMBERS.filter(m => !ministers.includes(m)).map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newMinister}
                    onChange={(e) => setNewMinister(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMinister()}
                    placeholder="O escribir manualmente"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={addMinister}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Puedes añadir múltiples ministros/líderes
                </p>
              </div>
            </div>
          )}

          {activeTab === 'worship' && (
            <WorshipSection
              songs={worshipData.songs || []}
              leader={worshipData.leader || ''}
              onChange={(data) => updateSection('worship', data)}
            />
          )}

          {activeTab === 'liturgy' && (
            <LiturgySection
              scripture={liturgyData.scripture}
              prayerOpening={liturgyData.prayerOpening}
              prayerClosing={liturgyData.prayerClosing}
              sermonTheme={liturgyData.sermonTheme}
              sermonType={liturgyData.sermonType || 'Sermón'}
              keyVerse={liturgyData.keyVerse}
              onChange={(data) => updateSection('liturgy', data)}
            />
          )}

          {activeTab === 'assignments' && (
            <AssignmentsSection
              assignments={assignmentsData.assignments || []}
              onChange={(assignments) => updateSection('assignments', { assignments })}
            />
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales</label>
              <div className="h-96 overflow-y-auto">
                <RichTextEditor
                  content={notesData.content || ''}
                  onChange={(html) => updateSection('notes', { content: html })}
                  placeholder="Escribe notas adicionales sobre el servicio..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
