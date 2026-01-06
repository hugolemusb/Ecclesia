import React, { useState, useEffect } from 'react';
import { Person, Evaluation, CalendarEvent } from '../../types';
import { UserCheck, FileText, Save, X, Search, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AnalysisEditorProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person;
    onSave: (p: Person) => void;
    allPeople: Person[];
    setEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    onGenerateReport: () => void; // Restored prop
}

const MemberAnalysisEditor: React.FC<AnalysisEditorProps> = ({ isOpen, onClose, person, onSave, allPeople, setEvents, onGenerateReport }) => {
    const [mentorType, setMentorType] = useState<'INTERNAL' | 'EXTERNAL'>(person.isMentorExternal ? 'EXTERNAL' : 'INTERNAL');
    const [mentorSearch, setMentorSearch] = useState('');
    const [selectedMentor, setSelectedMentor] = useState<Person | null>(
        person.assignedMentorId ? allPeople.find(p => p.id === person.assignedMentorId) || null : null
    );
    const [externalMentorName, setExternalMentorName] = useState(person.assignedMentorName || '');
    const [notes, setNotes] = useState(person.pastoralNotes || '');
    const [nextEvalDate, setNextEvalDate] = useState('');
    const [createHistoryEntry, setCreateHistoryEntry] = useState(true); // Default to true per user request

    // Reset state when person changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setMentorType(person.isMentorExternal ? 'EXTERNAL' : 'INTERNAL');
            setExternalMentorName(person.assignedMentorName || '');
            setNotes(person.pastoralNotes || '');
            setSelectedMentor(person.assignedMentorId ? allPeople.find(p => p.id === person.assignedMentorId) || null : null);
            setCreateHistoryEntry(true); // Forced to TRUE by default per user request

            // Calculate default next date (e.g., +3 months) if not set. 
            // If we want to force confirmation, maybe we shouldn't autopopulate? 
            // User said "fecha sugerida sea obligacion confirmar". Suggesting is fine.
            const d = new Date();
            d.setMonth(d.getMonth() + 3);
            setNextEvalDate(d.toISOString().split('T')[0]);
        }
    }, [isOpen, person, allPeople]);

    const validateAndSave = (shouldOpenReport = false) => {
        // Validation: Date is mandatory for tracking
        if (!nextEvalDate) {
            alert("Es obligatorio confirmar la fecha de la próxima evaluación.");
            return;
        }

        const mentorName = mentorType === 'INTERNAL' ? selectedMentor?.name : externalMentorName;

        // 1. Create Profile Update
        const updatedPerson: Person = {
            ...person,
            isMentorExternal: mentorType === 'EXTERNAL',
            assignedMentorId: mentorType === 'INTERNAL' ? selectedMentor?.id : undefined,
            assignedMentorName: mentorName,
            pastoralNotes: notes
        };

        // 2. ALWAYS Create Tracking Entry (since we forced it true)
        // If user really wants to skip, we'd need a way, but requirement says "obligacion".
        // We'll keep the checkbox UI for visibility but functionality is tied to it being checked.
        if (createHistoryEntry) {
            const newEval: Evaluation = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                type: 'Entrevista',
                summary: 'Diagnóstico Inicial / Seguimiento',
                notes: `Mentor asignado: ${mentorName || 'Ninguno'}. Próxima revisión: ${nextEvalDate}`,
                nextAction: nextEvalDate,
                mentor: mentorName
            };

            const currentEvaluations = updatedPerson.evaluations || [];
            updatedPerson.evaluations = [newEval, ...currentEvaluations];

            // 3. Add to Internal Calendar
            if (nextEvalDate && setEvents) {
                const newEvent: CalendarEvent = {
                    id: `eval-${Date.now()}`,
                    title: `Seguimiento: ${person.name}`,
                    start: new Date(nextEvalDate + 'T10:00').toISOString(), // Fixed time for now
                    end: new Date(nextEvalDate + 'T11:00').toISOString(),
                    type: 'internal',
                    status: 'programado',
                    description: `Mentoria con ${mentorName || 'Pastor'}. Notas: ${notes}`
                };
                setEvents(prev => [...prev, newEvent]);
            }
        }

        onSave(updatedPerson);
        onClose();
        if (shouldOpenReport) {
            onGenerateReport();
        }
    };

    const handleSave = () => validateAndSave(false);
    const handleSaveAndReport = () => validateAndSave(true);

    const filteredMentors = allPeople
        .filter(p =>
            p.status === 'Activo' &&
            p.name.toLowerCase().includes(mentorSearch.toLowerCase()) &&
            p.id !== person.id
        )
        .slice(0, 5);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configuración de Seguimiento"
            size="lg" // Reverted to lg per user request
            footer={
                <>
                    <div className="flex items-center gap-2 mr-auto bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                        <input
                            type="checkbox"
                            id="createHistory"
                            checked={true} // Always checked
                            disabled={true} // Cannot be unchecked
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed"
                            readOnly
                        />
                        <label htmlFor="createHistory" className="text-sm font-bold text-blue-800 select-none opacity-70">
                            Confirmar y Agendar (Obligatorio)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            icon={<Save size={18} />}
                        >
                            Guardar
                        </Button>
                        <Button
                            onClick={handleSaveAndReport}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            icon={<FileText size={18} />}
                        >
                            Ver Informe
                        </Button>
                    </div>
                </>
            }
        >
            <div className="space-y-8 p-2">

                {/* 1. MENTOR ASSIGNMENT */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-wide mb-4 text-sm">
                        <UserCheck size={18} className="text-blue-600" /> Asignación de Mentor / Guía
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => setMentorType('INTERNAL')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mentorType === 'INTERNAL' ? 'border-blue-500 bg-white shadow-md' : 'border-slate-200 hover:bg-slate-100'}`}
                        >
                            <span className="block font-black text-xs uppercase mb-1 text-slate-800">Miembro de la Iglesia</span>
                            <span className="text-[10px] text-slate-400">Seleccionar de la lista de miembros activos.</span>
                        </button>
                        <button
                            onClick={() => setMentorType('EXTERNAL')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${mentorType === 'EXTERNAL' ? 'border-blue-500 bg-white shadow-md' : 'border-slate-200 hover:bg-slate-100'}`}
                        >
                            <span className="block font-black text-xs uppercase mb-1 text-slate-800">Mentor Externo / Otro</span>
                            <span className="text-[10px] text-slate-400">Ingresar nombre manualmente (Pastor externo, red, etc).</span>
                        </button>
                    </div>

                    {mentorType === 'INTERNAL' ? (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="relative">
                                <Input
                                    label="Buscar Miembro"
                                    icon={<Search size={16} />}
                                    value={mentorSearch}
                                    onChange={(e) => setMentorSearch(e.target.value)}
                                    placeholder="Escriba nombre del mentor..."
                                    className="uppercase font-bold"
                                />
                                {mentorSearch.length > 1 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                        {filteredMentors.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedMentor(m);
                                                    setMentorSearch('');
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-xs font-bold text-slate-700 border-b border-slate-50 last:border-0 flex justify-between items-center"
                                            >
                                                <span>{m.name}</span>
                                                <span className="text-[9px] uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">{m.churchPositions?.[0] || 'Miembro'}</span>
                                            </button>
                                        ))}
                                        {filteredMentors.length === 0 && (
                                            <div className="p-4 text-center text-xs text-slate-400 italic">No se encontraron miembros</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedMentor && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                            {selectedMentor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">Mentor Seleccionado</p>
                                            <p className="text-sm font-bold text-blue-700">{selectedMentor.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMentor(null)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className="animate-in fade-in">
                            <Input
                                label="Nombre del Mentor Externo o Rol"
                                value={externalMentorName}
                                onChange={(e) => setExternalMentorName(e.target.value.toUpperCase())}
                                placeholder="EJ: PASTOR JUAN PÉREZ (IGLESIA CENTRO)"
                                className="uppercase font-bold"
                            />
                        </div>
                    )}
                </div>



                {/* 3. NEXT EVALUATION DATE */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-wide mb-4 text-sm">
                        <FileText size={18} className="text-emerald-600" /> Próxima Evaluación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <p className="text-xs text-slate-500">
                            Establece una fecha tentativa para revisar el progreso de este miembro. Esto creará un registro inicial en la ficha de seguimiento.
                        </p>
                        <Input
                            type="date"
                            label="Fecha Sugerida"
                            value={nextEvalDate}
                            onChange={(e) => setNextEvalDate(e.target.value)}
                            className="font-bold text-slate-700"
                        />
                    </div>
                </div>

                {/* 2. PASTORAL NOTES */}
                <div className="bg-white p-1">
                    <h3 className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-wide mb-4 text-sm">
                        <FileText size={18} className="text-amber-500" /> Observaciones Pastorales
                    </h3>
                    <textarea
                        className="w-full h-32 p-4 bg-amber-50/30 border border-amber-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none placeholder:text-slate-400"
                        placeholder="Escriba aquí observaciones específicas, áreas a trabajar, o detalles confidenciales para el seguimiento..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                        Estas notas aparecerán en el informe impreso.
                    </p>
                </div>

            </div>
        </Modal >
    );
};

export default MemberAnalysisEditor;
