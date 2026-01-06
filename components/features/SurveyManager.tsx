
import React, { useState } from 'react';
import {
  ClipboardCheck, Plus, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, FileText, X, Save, Trash2, Eye, Copy, Edit3, AlertCircle
} from 'lucide-react';
import { UserRole, SurveyTemplate, Question, Person, SurveyResponse } from '../../types';
import SurveyTaker from './SurveyTaker';

interface SurveyManagerProps {
  role: UserRole;
  templates: SurveyTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<SurveyTemplate[]>>;
  people: Person[];
  setResponses: React.Dispatch<React.SetStateAction<SurveyResponse[]>>;
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
}

const SurveyManager: React.FC<SurveyManagerProps> = ({ role, templates, setTemplates, people, setResponses, setPeople }) => {
  const [filter, setFilter] = useState<string>('Todos');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [selectedTemplateForView, setSelectedTemplateForView] = useState<SurveyTemplate | null>(null);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);

  const [newSurvey, setNewSurvey] = useState<Partial<SurveyTemplate>>({
    name: '',
    description: '',
    category: 'Básico',
    target: 'Toda la hermandad',
    status: 'draft',
    questions: []
  });

  const categories = ['Todos', 'Básico', 'Intermedio', 'Avanzado', 'Anual', 'Especial'];

  const filteredTemplates = templates.filter(t =>
    filter === 'Todos' || t.category === filter
  );

  const handleOpenCreator = (template?: SurveyTemplate, isDuplicate = false) => {
    setCreationStep(1);
    if (template) {
      setNewSurvey({
        ...template,
        name: isDuplicate ? `${template.name} (COPIA)`.toUpperCase() : template.name.toUpperCase(),
        id: isDuplicate ? Date.now() : template.id,
        status: isDuplicate ? 'draft' : template.status,
        responses: isDuplicate ? 0 : template.responses
      });
      setEditingTemplateId(isDuplicate ? null : template.id);
    } else {
      setNewSurvey({
        name: '',
        description: '',
        category: 'Básico',
        target: 'Toda la hermandad',
        status: 'draft',
        questions: []
      });
      setEditingTemplateId(null);
    }
    setIsCreatorOpen(true);
  };

  const handleAddQuestion = () => {
    const q: Question = {
      id: Date.now(),
      text: '',
      type: 'multiple',
      options: ['OPCIÓN 1', 'OPCIÓN 2'],
      required: true
    };
    setNewSurvey(prev => ({ ...prev, questions: [...(prev.questions || []), q] }));
  };

  const updateQuestion = (id: number, fields: Partial<Question>) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.map(q => {
        if (q.id === id) {
          const updated = { ...q, ...fields };
          if (updated.text) updated.text = updated.text.toUpperCase();
          return updated;
        }
        return q;
      })
    }));
  };

  const removeQuestion = (id: number) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== id)
    }));
  };

  const handleSaveSurvey = (status: 'active' | 'draft') => {
    if (!newSurvey.name || (newSurvey.questions?.length || 0) === 0) {
      alert("La encuesta debe tener un nombre y al menos una pregunta.");
      return;
    }

    const surveyToSave: SurveyTemplate = {
      ...(newSurvey as SurveyTemplate),
      id: editingTemplateId || Date.now(),
      status: status,
      responses: newSurvey.responses || 0,
      createdAt: newSurvey.createdAt || new Date().toISOString().split('T')[0]
    };

    setTemplates(prev => {
      const exists = prev.find(t => t.id === surveyToSave.id);
      if (exists) {
        return prev.map(t => t.id === surveyToSave.id ? surveyToSave : t);
      }
      return [...prev, surveyToSave];
    });

    setIsCreatorOpen(false);
    setEditingTemplateId(null);
  };

  const handleDeleteTemplate = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta encuesta permanentemente?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-900">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Diagnóstico Ministerial</h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${filter === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleOpenCreator()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus size={18} /> Crear Encuesta
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredTemplates.map((t, idx) => (
            <div key={t.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${t.status === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {t.status === 'draft' ? 'B' : idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-slate-900 text-lg uppercase tracking-tight">{t.name}</h4>
                    {t.status === 'draft' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> Borrador
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{t.category}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl font-medium uppercase truncate">{t.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <button
                  onClick={() => { setSelectedTemplateForView(t); setIsPreviewOpen(true); }}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Visualizar"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleOpenCreator(t, true)}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Duplicar (Usar como plantilla)"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => handleOpenCreator(t)}
                  className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="p-20 text-center opacity-40">
              <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-sm font-bold uppercase tracking-widest">Sin registros en esta categoría</p>
            </div>
          )}
        </div>
      </div>

      {isCreatorOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-900">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
                  {editingTemplateId ? <Edit3 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tighter">
                    {editingTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    PASO {creationStep} DE 2: {creationStep === 1 ? 'IDENTIFICACIÓN' : 'PREGUNTAS'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {creationStep === 2 && (
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all uppercase tracking-widest"
                  >
                    <Eye size={16} /> Vista Previa
                  </button>
                )}
                <button onClick={() => setIsCreatorOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {creationStep === 1 ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Encuesta</label>
                      <input
                        type="text"
                        value={newSurvey.name}
                        onChange={(e) => setNewSurvey({ ...newSurvey, name: e.target.value.toUpperCase() })}
                        placeholder="EJ: ENCUESTA DE MEMBRESÍA 2025"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-2 focus:ring-blue-600 uppercase"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría de Análisis</label>
                      <select value={newSurvey.category} onChange={(e) => setNewSurvey({ ...newSurvey, category: e.target.value as any })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900">
                        {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Propósito Ministerial</label>
                    <textarea value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value.toUpperCase() })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none h-40 resize-none text-slate-900 focus:ring-2 focus:ring-blue-600 uppercase" placeholder="DEFINA BREVEMENTE PARA QUÉ SE UTILIZARÁ ESTE DIAGNÓSTICO..." />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Configuración de Preguntas</h4>
                    <button onClick={handleAddQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all uppercase tracking-widest"><Plus size={16} /> Añadir Pregunta</button>
                  </div>
                  <div className="space-y-4">
                    {newSurvey.questions?.map((q, idx) => (
                      <div key={q.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 relative group animate-in slide-in-from-top-2">
                        <button onClick={() => removeQuestion(q.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        <div className="flex gap-4">
                          <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black shrink-0 text-slate-900 shadow-sm">{idx + 1}</span>
                          <div className="flex-1 space-y-4">
                            <input type="text" value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value.toUpperCase() })} placeholder="ESCRIBA LA PREGUNTA AQUÍ..." className="w-full bg-transparent border-b border-slate-200 pb-1 text-sm font-bold outline-none focus:border-blue-500 text-slate-900 uppercase" />
                            <div className="grid grid-cols-2 gap-4">
                              <select value={q.type} onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200 outline-none text-slate-900">
                                <option value="multiple">Opción Múltiple</option>
                                <option value="likert">Escala de Satisfacción</option>
                                <option value="texto">Respuesta Libre</option>
                                <option value="sino">Sí / No</option>
                              </select>
                              {q.type === 'multiple' && (
                                <input type="text" value={q.options?.join(', ')} onChange={(e) => updateQuestion(q.id, { options: e.target.value.split(',').map(s => s.trim().toUpperCase()) })} placeholder="OPCIONES (EJ: BAJO, MEDIO, ALTO)" className="bg-white px-4 py-2 rounded-xl text-[10px] font-black border border-slate-200 outline-none text-slate-900 uppercase" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!newSurvey.questions || newSurvey.questions.length === 0) && (
                      <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Añada al menos una pregunta para habilitar el diagnóstico</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-900 border-t flex justify-between gap-4 shadow-inner">
              {creationStep === 2 ? (
                <button
                  onClick={() => setCreationStep(1)}
                  className="px-6 py-3.5 bg-slate-800 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Volver
                </button>
              ) : (
                <div></div> /* Spacer */
              )}

              <div className="flex gap-4">
                {creationStep === 1 ? (
                  <button
                    onClick={() => {
                      if (!newSurvey.name?.trim()) {
                        alert("Por favor ingrese un nombre para la encuesta.");
                        return;
                      }
                      setCreationStep(2);
                    }}
                    className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Siguiente Paso <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleSaveSurvey('draft')} className="px-6 py-3.5 bg-slate-800 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                      <FileText size={16} /> Guardar Borrador
                    </button>
                    <button onClick={() => handleSaveSurvey('active')} className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2">
                      Publicar <CheckCircle2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <SurveyTaker
          person={people[0] || { name: 'HERMANO(A) PRUEBA' } as any}
          templates={selectedTemplateForView ? [selectedTemplateForView] : [{ ...newSurvey, name: newSurvey.name || 'VISTA PREVIA SIN TÍTULO', questions: newSurvey.questions || [] } as any]}
          onClose={() => { setIsPreviewOpen(false); setSelectedTemplateForView(null); }}
          onSave={() => { setIsPreviewOpen(false); setSelectedTemplateForView(null); }}
          people={people}
          setResponses={setResponses}
          setPeople={setPeople}
          isPreview={true}
        />
      )}
    </div>
  );
};

export default SurveyManager;
