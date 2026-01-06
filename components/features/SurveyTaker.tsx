
import React, { useState, useMemo } from 'react';
import { X, Save, ClipboardCheck, ChevronRight, Check, Search, Calendar, User, LayoutGrid, Info } from 'lucide-react';
import { Person, SurveyTemplate, Answer, SurveyResponse, ChurchLocal, ChurchPosition } from '../../types';
import { db } from '../../db';
import { OFFICIAL_MINISTRIES } from '../../constants';

interface SurveyTakerProps {
  person: Person;
  templates: SurveyTemplate[];
  onClose: () => void;
  onSave: () => void;
  people: Person[];
  setResponses: React.Dispatch<React.SetStateAction<SurveyResponse[]>>;
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  isPreview?: boolean;
}

const SurveyTaker: React.FC<SurveyTakerProps> = ({ person: initialPerson, templates, onClose, onSave, people, setResponses, setPeople, isPreview = false }) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(initialPerson || null);
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [step, setStep] = useState<'member-select' | 'profile-verify' | 'template-select' | 'header' | 'form'>('member-select');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Step Logic
  React.useEffect(() => {
    if (initialPerson) {
      setSelectedPerson(initialPerson);

      // PREVIEW MODE FAST-PATH
      if (isPreview && templates.length > 0) {
        const t = templates[0];
        setSelectedTemplate(t);
        setAnswers(t.questions.map(q => ({ questionId: q.id, value: '' })));
        setStep('form');
      } else {
        setStep('profile-verify'); // Standard flow
      }
    } else {
      setStep('member-select');
    }
  }, [initialPerson, isPreview]);

  const availableTemplates = useMemo(() => {
    return isPreview ? templates : templates.filter(t => t.status === 'active');
  }, [templates, isPreview]);

  // Profile Data State for Verification
  const [profileData, setProfileData] = useState({
    ministries: [] as string[],
    roles: [] as string[], // Changed to array
    locals: [] as string[], // Changed to array
    address: '',
    phone: ''
  });

  // Load person data into profile state when person is selected
  React.useEffect(() => {
    if (selectedPerson) {
      setProfileData({
        ministries: selectedPerson.ministries || [],
        // Use churchPositions if available, otherwise try fallback or empty
        roles: selectedPerson.churchPositions || [],
        // local is string, split by comma for multi-select support
        locals: selectedPerson.local ? selectedPerson.local.split(',').map(s => s.trim()) : ['Iglesia Matriz'],
        address: selectedPerson.address || '',
        phone: selectedPerson.phone || ''
      });
    }
  }, [selectedPerson]);


  const handleMemberSelect = (person: Person) => {
    setSelectedPerson(person);
    setStep('profile-verify');
  };

  const handleProfileConfirm = () => {
    if (!selectedPerson) return;

    // map profileData back to flattened Person structure
    const updatedPersonData = {
      ministries: profileData.ministries,
      churchPositions: profileData.roles,
      local: profileData.locals.join(', '), // Join back to string
      address: profileData.address,
      phone: profileData.phone
    };

    // Save profile updates immediately
    setPeople(prev => prev.map(p =>
      p.id === selectedPerson.id
        ? { ...p, ...updatedPersonData } // Update internal DB state
        : p
    ));

    // Update local selected person object references
    setSelectedPerson(prev => prev ? ({ ...prev, ...updatedPersonData }) : null);

    // Initial Template logic
    if (availableTemplates.length === 1 && !selectedTemplate) {
      // If only 1 template available (e.g. passed specific one), auto-select it
      const t = availableTemplates[0];
      setSelectedTemplate(t);
      setAnswers(t.questions.map(q => ({ questionId: q.id, value: '' })));
      setStep('header');
    } else {
      // Otherwise, let them pick template
      setStep('template-select');
    }
  };

  const handleSelectTemplate = (template: SurveyTemplate) => {
    setSelectedTemplate(template);
    setAnswers(template.questions.map(q => ({ questionId: q.id, value: '' })));
    setStep('header');
  };

  const handleAnswerChange = (questionId: number, value: string | number) => {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, value } : a));
  };

  /* Header Data Logic from previous implementation */
  const [headerData, setHeaderData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tema: '',
    gestorName: '', // Could be current admin name
    compromisoComunitario: ''
  });

  const calculateScore = () => {
    const relevantAnswers = answers.filter(a => {
      const q = selectedTemplate?.questions.find(que => que.id === a.questionId);
      return q?.type === 'likert' || q?.type === 'sino' || q?.type === 'multiple';
    });

    if (relevantAnswers.length === 0) return 50;

    let total = 0;
    relevantAnswers.forEach(a => {
      const val = String(a.value).toUpperCase();
      if (val.includes('1 -')) total += 20;
      else if (val.includes('2 -')) total += 40;
      else if (val.includes('3 -')) total += 60;
      else if (val.includes('4 -')) total += 80;
      else if (val.includes('5 -')) total += 100;
      else if (val === 'DIARIO' || val === 'SÍ' || val === 'VERDADERO') total += 100;
      else if (val === '3-4 VECES POR SEMANA') total += 70;
      else if (val === 'OCASIONALMENTE' || val === 'NO' || val === 'FALSO') total += 30;
      else if (val) total += 50;
    });

    return Math.round(total / relevantAnswers.length);
  };

  const handleFinish = () => {
    if (!selectedTemplate || !selectedPerson) return;

    // Re-construct data just in case
    const updatedPersonData = {
      ministries: profileData.ministries,
      churchPositions: profileData.roles,
      local: profileData.locals.join(', '),
      address: profileData.address,
      phone: profileData.phone
    };

    // Additional Profile Sync (just to be safe/redundant or if we want last-minute sync)
    setPeople(prev => prev.map(p =>
      p.id === selectedPerson.id
        ? { ...p, ...updatedPersonData }
        : p
    ));

    if (isPreview) {
      alert("FINALIZADO: VISTA PREVIA (NO GUARDADO).");
      onSave();
      return;
    }

    const score = calculateScore();
    const newResponse: SurveyResponse = {
      id: Date.now(),
      templateId: selectedTemplate.id,
      personId: selectedPerson.id,
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      answers: [
        ...answers,
        { questionId: 9991, value: profileData.ministries.join(', ') }, // Auto-fill from profile data
        { questionId: 9992, value: profileData.roles.join(', ') }, // Roles
        { questionId: 9993, value: '' },
        { questionId: 9994, value: headerData.tema },
        { questionId: 9995, value: profileData.locals.join(', ') }, // Locals
        { questionId: 9996, value: headerData.gestorName },
        { questionId: 9997, value: headerData.compromisoComunitario }
      ],
      score: score
    };

    setResponses(prev => [...prev, newResponse]);
    // Allow updating commitment score if logic requires it
    setPeople(prev => prev.map(p =>
      p.id === selectedPerson.id ? { ...p, commitmentScore: score } : p // Update score on person?
    ));

    alert(`DIAGNÓSTICO GUARDADO.`);
    onSave();
  };

  // --- RENDER HELPERS ---
  const filteredPeople = useMemo(() => {
    if (!searchTerm) return [];
    return people.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8);
  }, [people, searchTerm]);


  const churchLocals: ChurchLocal[] = ['Iglesia Matriz', 'Apóstol Pedro', 'Luis Pérez', 'La Hermosa', 'Ninguno'];
  const churchPositions: ChurchPosition[] = ['Pastor', 'Líder', 'Guía', 'Ayudante', 'Profesor', 'Diácono', 'Hermano'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black truncate max-w-[400px] uppercase tracking-tighter">
                {step === 'member-select' ? 'Seleccionar Miembro' :
                  step === 'profile-verify' ? 'Verificar Perfil' :
                    step === 'template-select' ? 'Seleccionar Encuesta' :
                      `Medición: ${selectedPerson?.name}`}
              </h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">ADMINISTRACIÓN PASTORAL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"><X size={24} /></button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {/* STEP 1: MEMBER SELECTION */}
          {step === 'member-select' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  autoFocus
                  placeholder="BUSCAR POR NOMBRE..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                {filteredPeople.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleMemberSelect(p)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 group-hover:text-blue-700 uppercase">{p.name}</div>
                      <div className="text-xs text-slate-400 font-medium">{p.churchPositions?.join(', ') || p.roleInFamily} • {p.local || 'Sin Local'}</div>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-400" size={20} />
                  </button>
                ))}
                {searchTerm && filteredPeople.length === 0 && (
                  <div className="text-center p-8 text-slate-400 font-medium">No se encontraron miembros</div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE VERIFICATION (MULTI-SELECT UPDATE) */}
          {step === 'profile-verify' && selectedPerson && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800 mb-6">
                <Info className="shrink-0" size={20} />
                <p className="text-xs font-bold leading-relaxed">
                  Verifique los datos actuales. Puede seleccionar múltiples opciones para Cargo y Local.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo Eclesiástico (Multiopción)</label>
                  <div className="flex flex-wrap gap-2">
                    {churchPositions.map(r => {
                      const isActive = profileData.roles.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => setProfileData(prev => ({
                            ...prev,
                            roles: isActive ? prev.roles.filter(x => x !== r) : [...prev.roles, r]
                          }))}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'}`}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local / Congregación (Multiopción)</label>
                  <div className="flex flex-wrap gap-2">
                    {churchLocals.map(l => {
                      const isActive = profileData.locals.includes(l);
                      return (
                        <button
                          key={l}
                          onClick={() => setProfileData(prev => ({
                            ...prev,
                            locals: isActive ? prev.locals.filter(x => x !== l) : [...prev.locals, l]
                          }))}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ministerios Activos</label>
                  <div className="flex flex-wrap gap-2">
                    {OFFICIAL_MINISTRIES.map(m => {
                      const isActive = profileData.ministries.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setProfileData(prev => ({
                              ...prev,
                              ministries: isActive
                                ? prev.ministries.filter(im => im !== m)
                                : [...prev.ministries, m]
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isActive ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  onClick={handleProfileConfirm}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all text-xs flex items-center gap-2"
                >
                  Confirmar y Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TEMPLATE SELECTION (If multiple) */}
          {step === 'template-select' && (
            <div className="grid grid-cols-1 gap-4">
              {availableTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700 uppercase">{t.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{t.category} • {t.questions.length} Preguntas</p>
                </button>
              ))}
            </div>
          )}


          {/* STEP 4: HEADER DETAILS FORM */}
          {step === 'header' && selectedTemplate && (
            <div className="space-y-6 animate-in slide-in-from-right-8">
              {/* Simplified header form since we verified profile already */}
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Detalles de la Sesión</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label>
                    <input type="date" value={headerData.fecha} onChange={e => setHeaderData({ ...headerData, fecha: e.target.value })} className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Entrevistador (Admin)</label>
                    <input type="text" value={headerData.gestorName} onChange={e => setHeaderData({ ...headerData, gestorName: e.target.value })} placeholder="SU NOMBRE..." className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-bold uppercase" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep('form')}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all text-xs flex items-center gap-2"
                >
                  Comenzar Cuestionario <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: QUESTIONS FORM */}
          {step === 'form' && selectedTemplate && (
            <div className="space-y-8 animate-in slide-in-from-right-8 pb-20">
              {selectedTemplate.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{idx + 1}</span>
                    <h4 className="font-bold text-slate-800 text-sm uppercase leading-relaxed">{q.text}</h4>
                  </div>

                  {q.type === 'multiple' && (
                    <div className="pl-9 space-y-2">
                      {q.options?.map((opt) => (
                        <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${answers.find(a => a.questionId === q.id)?.value === opt ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={answers.find(a => a.questionId === q.id)?.value === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers.find(a => a.questionId === q.id)?.value === opt ? 'border-white' : 'border-slate-300'}`}>
                            {answers.find(a => a.questionId === q.id)?.value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold uppercase">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'checkbox' && (
                    <div className="pl-9 space-y-2">
                      {q.options?.map((opt) => {
                        const currentVal = String(answers.find(a => a.questionId === q.id)?.value || '');
                        const selectedOptions = currentVal ? currentVal.split(', ') : [];
                        const isSelected = selectedOptions.includes(opt);

                        return (
                          <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <input
                              type="checkbox"
                              name={`q-${q.id}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => {
                                const newOptions = isSelected
                                  ? selectedOptions.filter(o => o !== opt)
                                  : [...selectedOptions, opt];
                                handleAnswerChange(q.id, newOptions.join(', '));
                              }}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${isSelected ? 'border-white bg-indigo-600' : 'border-slate-300'}`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold uppercase">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'sino' && (
                    <div className="pl-9 grid grid-cols-2 gap-4">
                      {['SÍ', 'NO'].map((opt) => (
                        <label key={opt} className={`flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers.find(a => a.questionId === q.id)?.value === opt
                          ? (opt === 'SÍ' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30')
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={answers.find(a => a.questionId === q.id)?.value === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="hidden"
                          />
                          <span className="text-sm font-black uppercase tracking-widest">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'likert' && (
                    <div className="pl-9">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isSelected = answers.find(a => a.questionId === q.id)?.value === String(val);
                          // Color scale: 1=Red, 5=Green
                          const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];

                          return (
                            <label key={val} className="flex-1 cursor-pointer group relative">
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={val}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(q.id, String(val))}
                                className="hidden"
                              />
                              <div className={`h-12 flex items-center justify-center rounded-xl transition-all ${isSelected
                                ? `${colors[val - 1]} text-white shadow-lg scale-105 font-black`
                                : 'text-slate-400 font-bold hover:bg-white hover:shadow-sm'
                                }`}>
                                {val}
                              </div>
                              {val === 1 && <span className="absolute -bottom-6 left-0 text-[9px] font-bold text-slate-400 uppercase">Deficiente</span>}
                              {val === 5 && <span className="absolute -bottom-6 right-0 text-[9px] font-bold text-slate-400 uppercase">Excelente</span>}
                            </label>
                          )
                        })}
                      </div>
                      <div className="h-6"></div>
                    </div>
                  )}

                  {q.type === 'texto' && (
                    <div className="pl-9">
                      <textarea
                        value={String(answers.find(a => a.questionId === q.id)?.value || '')}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 uppercase min-h-[100px]"
                        placeholder="Escriba su respuesta aquí..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS (Only for form step) */}
        {step === 'form' && (
          <div className="p-6 border-t bg-slate-50 flex justify-between items-center shrink-0">
            <div className="text-xs font-bold text-slate-400">
              {answers.filter(a => a.value).length} / {selectedTemplate?.questions.length} Respondidas
            </div>
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={18} /> Finalizar Encuesta
            </button>
          </div>
        )}

      </div>
    </div >
  );
};

export default SurveyTaker;
