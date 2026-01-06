import React, { useState } from 'react';
import { Person, Evaluation } from '../../types';
import { Calendar, Plus, FileText, Check, UserCheck, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface EvaluationHistoryProps {
    person: Person;
    onUpdatePerson: (updatedPerson: Person) => void;
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ person, onUpdatePerson }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvaluation, setNewEvaluation] = useState<Partial<Evaluation>>({
        type: 'Entrevista',
        date: new Date().toISOString().split('T')[0],
    });

    const handleAddEvaluation = () => {
        if (!newEvaluation.summary || !newEvaluation.date) return;

        const evaluation: Evaluation = {
            id: Date.now().toString(),
            date: newEvaluation.date!,
            type: newEvaluation.type as any,
            score: newEvaluation.score || '-',
            summary: newEvaluation.summary!,
            notes: '', // Added default to match type
            nextAction: newEvaluation.nextAction || '',
            mentor: newEvaluation.mentor || person.assignedMentorName || 'Pastor/Líder'
        };

        const updatedEvaluations = [evaluation, ...(person.evaluations || [])];
        onUpdatePerson({ ...person, evaluations: updatedEvaluations });
        setIsAddModalOpen(false);
        setNewEvaluation({ type: 'Entrevista', date: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteEvaluation = (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
        const updatedEvaluations = (person.evaluations || []).filter(e => e.id !== id);
        onUpdatePerson({ ...person, evaluations: updatedEvaluations });
    };

    const sourceTypeColors = {
        'Entrevista': 'text-blue-600 bg-blue-50 border-blue-200',
        'Encuesta': 'text-emerald-600 bg-emerald-50 border-emerald-200',
        'Observación': 'text-amber-600 bg-amber-50 border-amber-200',
        'Reunión': 'text-purple-600 bg-purple-50 border-purple-200',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Ficha de Seguimiento
                    </h3>
                    <p className="text-xs text-slate-400">Historial de conversaciones y evaluaciones.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                    className="uppercase text-[10px] tracking-wide"
                    leftIcon={<Plus size={14} />}
                >
                    Nueva Evaluación
                </Button>
            </div>

            {(!person.evaluations || person.evaluations.length === 0) ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-400 font-medium">No hay evaluaciones registradas.</p>
                    <p className="text-xs text-slate-300">Inicia el seguimiento agregando el primer registro.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {person.evaluations.map((ev) => (
                        <div key={ev.id} className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${sourceTypeColors[ev.type] || 'text-slate-600'}`}>
                                        {ev.type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(ev.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ev.score && (
                                        <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                            Nota: {ev.score}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteEvaluation(ev.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Eliminar Registro"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 mb-3 italic">"{ev.summary}"</p>

                            {(ev.nextAction || ev.mentor) && (
                                <div className="flex gap-4 pt-3 border-t border-slate-50 text-xs">
                                    {ev.nextAction && (
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                            <Check size={14} /> Próx: {ev.nextAction}
                                        </div>
                                    )}
                                    {ev.mentor && (
                                        <div className="flex items-center gap-1.5 text-slate-500 ml-auto">
                                            <UserCheck size={14} /> Por: {ev.mentor}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ADD MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Nueva Evaluación de Seguimiento"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddEvaluation}>Guardar Registro</Button>
                    </>
                }
            >
                <div className="space-y-4 p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={newEvaluation.type}
                                onChange={(e) => setNewEvaluation({ ...newEvaluation, type: e.target.value as any })}
                            >
                                <option value="Entrevista">Entrevista 1 a 1</option>
                                <option value="Observación">Observación y Feedback</option>
                                <option value="Reunión">Reunión de Discipulado</option>
                                <option value="Encuesta">Revisión de Encuesta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input
                                type="date"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
                                value={newEvaluation.date}
                                onChange={(e) => setNewEvaluation({ ...newEvaluation, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resumen / Observaciones</label>
                        <textarea
                            className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                            placeholder="Describe brevemente lo conversado o evaluado..."
                            value={newEvaluation.summary || ''}
                            onChange={(e) => setNewEvaluation({ ...newEvaluation, summary: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Próximo Paso / Tarea"
                            placeholder="Ej: Leer Juan 3"
                            value={newEvaluation.nextAction || ''}
                            onChange={(e) => setNewEvaluation({ ...newEvaluation, nextAction: e.target.value })}
                        />
                        <Input
                            label="Evaluador / Mentor"
                            placeholder={person.assignedMentorName || "Tu Nombre"}
                            value={newEvaluation.mentor || ''}
                            onChange={(e) => setNewEvaluation({ ...newEvaluation, mentor: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Calificación / Nivel (Opcional)"
                        placeholder="Ej: 7.0, Aprobado, Pendiente"
                        value={newEvaluation.score?.toString() || ''}
                        onChange={(e) => setNewEvaluation({ ...newEvaluation, score: e.target.value })}
                    />
                </div>
            </Modal>

        </div>
    );
};

export default EvaluationHistory;
