
import React, { useMemo } from 'react';
import { Person, SurveyResponse } from '../../types';
import {
    FileText, Calendar, CheckCircle2, AlertOctagon, X,
    BarChart3, Target, Zap, Heart, Shield, Award, UserCheck
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface MemberReportViewProps {
    person: Person;
    responses: SurveyResponse[];
    allPeople: Person[];
    onClose: () => void;
}

const MemberReportView: React.FC<MemberReportViewProps> = ({ person, responses, allPeople, onClose }) => {
    const analytics = useMemo(() => {
        const initialSurvey = responses.find(r => r.personId === person.id && r.templateId === 201);

        if (!initialSurvey) return null;

        const getAns = (id: number) => String(initialSurvey.answers.find(a => a.questionId === id)?.value || '');
        const hasOpt = (id: number, text: string) => getAns(id).toUpperCase().includes(text);

        // 1. Foundation Score
        let p2 = 0; if (hasOpt(20104, 'ASISTÍ')) p2 = 75; else if (hasOpt(20104, 'LEÍA')) p2 = 50; else if (hasOpt(20104, 'ALGO')) p2 = 25;
        let p5 = getAns(20107) === 'VERDADERO' ? 100 : (getAns(20107) === 'NO LO SÉ' ? 50 : 0);
        let p17 = 0;
        const a17 = getAns(20119).toUpperCase();
        if (a17.includes('CASI TODOS')) p17 = 100; else if (a17.includes('ALGUNAS')) p17 = 75; else if (a17.includes('OCASIONALMENTE')) p17 = 50;
        let p19 = 0; if (hasOpt(20121, 'MAYORÍA')) p19 = 100; else if (hasOpt(20121, 'ALGUNAS')) p19 = 75; else if (hasOpt(20121, 'CUESTA')) p19 = 25;

        const foundationScore = Math.round((p2 + p5 + p17 + p19) / 4);

        // 2. Profile Identification & Logic
        const changes = !hasOpt(20108, 'AÚN NO');
        const wantsBaptism = hasOpt(20111, 'YA ESTOY') || hasOpt(20111, 'GUSTARÍA');
        const isCrisis = hasOpt(20122, 'NECESIDAD') || hasOpt(20117, 'APOYO ESPIRITUAL');
        const isRelational = hasOpt(20103, 'AMIGO') || hasOpt(20122, 'INFLUENCIA');

        let profile = 'B';
        if (p5 === 100 && changes && p17 >= 75 && wantsBaptism) profile = 'A';
        else if (isCrisis) profile = 'C';
        else if (isRelational && foundationScore < 50) profile = 'D';

        const profileData = {
            A: { title: 'Sediento Espiritual', color: 'indigo', icon: Zap, desc: 'Alta motivación y crecimiento rápido. Ideal para liderazgo futuro.' },
            B: { title: 'Explorador Cauto', color: 'blue', icon: BarChart3, desc: 'Avanza seguro pero necesita evidencias y no presión.' },
            C: { title: 'Buscador en Crisis', color: 'rose', icon: Shield, desc: 'Prioridad: Contención emocional y espiritual antes de doctrina.' },
            D: { title: 'Acompañante Relacional', color: 'amber', icon: Heart, desc: 'Vínculo principal es social. Necesita encuentro personal con Dios.' }
        }[profile] || { title: 'Evaluando', color: 'slate', icon: AlertOctagon, desc: 'Perfil en definición' };

        // 3. Barriers
        const barriers = [];
        if (a17.includes('NO SÉ')) barriers.push('No sabe orar/leer Biblia');
        if (hasOpt(20117, 'APOYO')) barriers.push('Necesidad de Apoyo Urgente');
        if (hasOpt(20113, 'TRABAJO')) barriers.push('Horarios Laborales');
        if (hasOpt(20113, 'DISTANCIA')) barriers.push('Distancia Geográfica');

        // 4. Windows
        const windows = [];
        if (getAns(20114) === 'VERDADERO') windows.push('Dispuesto al Discipulado');
        if (!getAns(20115).includes('NO ME SIENTO LISTO')) windows.push('Interés en Servicio');


        return {
            foundationScore,
            profile,
            profileData,
            barriers,
            windows,
            scores: { p2, p5, p17, p19 }
        };
    }, [person, responses]);

    if (!analytics) return <div className="p-8 text-center">Datos insuficientes para generar reporte.</div>;

    const addToCalendar = () => {
        // 1. Get real date from latest evaluation
        const latestEval = person.evaluations && person.evaluations[0];
        const nextDate = latestEval?.nextAction; // YYYY-MM-DD string

        if (!nextDate) {
            alert("No hay una fecha de próxima evaluación registrada.");
            return;
        }

        // 2. Find Mentor Email
        let mentorEmail = '';
        if (person.assignedMentorId) {
            const mentor = allPeople.find(p => p.id === person.assignedMentorId);
            if (mentor && mentor.email) {
                mentorEmail = mentor.email;
            }
        }

        // 3. Construct Google Calendar URL
        // Dates format: YYYYMMDDTHHMMSSZ
        const start = nextDate.replace(/-/g, '') + 'T100000'; // Default 10 AM
        const end = nextDate.replace(/-/g, '') + 'T110000';   // Default 11 AM

        const event = {
            title: `Evaluación Seguimiento - ${person.name}`,
            details: `Revisión de progreso y plan de acción para ${person.name}. Mentor Asignado: ${person.assignedMentorName || 'No asignado'}.`,
            location: 'Iglesia / Por Definir',
        };

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}&dates=${start}/${end}&add=${encodeURIComponent(mentorEmail)}`;

        window.open(googleUrl, '_blank');
    };

    return (
        <div id="report-modal-root" className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-[99999]">
            {/* FORCE LETTER SIZE CSS */}
            <style type="text/css" media="print">
                {`
                    @page { size: letter; margin: 0.5in; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    
                    /* HIDE EVERYTHING via visibility so layout is preserved but invisible */
                    body * {
                        visibility: hidden;
                    }

                    /* SHOW ONLY THE REPORT and its children */
                    #report-modal-root, #report-modal-root * {
                        visibility: visible;
                    }

                    /* Position the report at top left of page */
                    #report-modal-root {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        z-index: 999999 !important;
                        overflow: visible !important; /* Allow content to flow */
                    }
                    
                    /* Utility classes */
                    .print-hidden { display: none !important; }
                    .print-visible { display: block !important; }
                `}
            </style>

            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col print:shadow-none print:rounded-none print:max-h-none print:overflow-visible print:w-full print:block">

                {/* Close Button X (Top Right) - Increased Z-Index and fixed positioning relative to modal */}
                <button
                    onClick={onClose}
                    className="fixed top-6 right-6 p-3 bg-slate-900 text-white hover:bg-red-500 rounded-full z-[300] shadow-xl transition-all print:hidden"
                    title="Cerrar Ventana"
                >
                    <X size={24} />
                </button>

                {/* PRINT CONTROLS (Sticky Header) */}
                <div className="sticky top-0 z-[250] bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg print:hidden">
                    <h2 className="font-bold flex items-center gap-2 text-sm md:text-base"><FileText size={20} /> Vista Preliminar (Tamaño Carta)</h2>

                    {/* NEXT EVALUATION DATE DISPLAY */}
                    <div className="bg-slate-700 px-3 py-1 rounded-lg border border-slate-600 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Próxima Evaluación:</span>
                        <span className="text-sm font-black text-white">
                            {person.evaluations && person.evaluations[0]?.nextAction
                                ? new Date(person.evaluations[0].nextAction).toLocaleDateString()
                                : 'No Programada'}
                        </span>
                    </div>

                    <div className="flex gap-2 mr-12">
                        <button onClick={addToCalendar} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-xs transition-colors flex items-center gap-2">
                            <Calendar size={14} /> <span className="hidden sm:inline">Agendar</span>
                        </button>
                        <button onClick={() => window.print()} className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/20">
                            Imprimir / PDF
                        </button>
                    </div>
                </div>

                {/* REPORT CONTENT (A4/Letter Optimized) */}
                <div className="p-8 md:p-12 print:p-0 flex-1 flex flex-col gap-8 bg-white text-slate-900 print:w-full">

                    {/* HEADER */}
                    <header className="border-b-2 border-indigo-900 pb-6 flex justify-between items-end">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Informe Confidencial de Discipulado</p>
                            <h1 className="text-4xl font-black text-slate-900 mb-1">{person.name} {person.lastName}</h1>
                            <div className="flex gap-4 text-sm font-bold text-slate-500">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date().toLocaleDateString()}</span>
                                <span className="text-slate-300">|</span>
                                <span>{analytics.profileData.title}</span>
                            </div>
                        </div>
                        <div className={`w - 16 h - 16 rounded - full bg - ${analytics.profileData.color} -50 flex items - center justify - center print:border print: border - slate - 200`}>
                            <analytics.profileData.icon size={32} className={`text - ${analytics.profileData.color} -600`} />
                        </div>
                    </header>

                    {/* SECTION 1: EXECUTIVE DIAGNOSTIC */}
                    <section className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 p-5 rounded-xl bg-slate-50 border border-slate-100 print:border-slate-200">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Diagnóstico General</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-600">Fundamento</span>
                                        <span className="font-black text-slate-800">{analytics.foundationScore}/100</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h - full rounded - full ${analytics.foundationScore > 75 ? 'bg-emerald-500' : 'bg-amber-500'} `} style={{ width: `${analytics.foundationScore}% ` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-600 block mb-1">Barreras Activas</span>
                                    {analytics.barriers.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {analytics.barriers.map(b => (
                                                <span key={b} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold uppercase rounded border border-rose-100">{b}</span>
                                            ))}
                                        </div>
                                    ) : <span className="text-[10px] text-emerald-600 font-bold">Ninguna detectada</span>}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 p-5 rounded-xl border-2 border-dashed border-slate-200 flex flex-col justify-center">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
                                        {analytics.profileData.title}
                                        <Badge variant="neutral">Perfil {analytics.profile}</Badge>
                                    </h3>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                        {analytics.profileData.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: ACTION PLAN */}
                    <section className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <Target size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-black uppercase text-slate-800">Plan de Acción Pastoral</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 print:bg-white print:border-slate-300">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-800 mb-4">Pasos Inmediatos (30 Días)</h4>
                                    <ul className="space-y-3">
                                        {/* Dynamic Actions based on Profile */}
                                        {analytics.profile === 'A' && (
                                            <>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Asignar mentor de Liderazgo (Nivel 2).</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Involucrar en equipo de servicio (acorde a dones).</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Agendar Bautismo (si aplica) o Clase Avanzada.</li>
                                            </>
                                        )}
                                        {analytics.profile === 'B' && (
                                            <>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Conexión social: Invitar a café post-culto.</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Resolver preguntas doctrinales específicas (1 a 1).</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Invitar a Grupo Pequeño (observador).</li>
                                            </>
                                        )}
                                        {analytics.profile === 'C' && (
                                            <>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> <strong>Prioridad:</strong> Consejería de contención.</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Asignar "Amigo Espiritual" para acompañamiento diario.</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Oración específica por ruptura de barreras.</li>
                                            </>
                                        )}
                                        {analytics.profile === 'D' && (
                                            <>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Separar del grupo de referencia en actividades clave.</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Desafío personal de lectura (Evangelio de Juan).</li>
                                                <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Entrevista breve: "¿Qué buscas tú?"</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                        {person.assignedMentorName ? 'Mentor / Guía Asignado' : 'Mentoría Recomendada'}
                                    </h4>
                                    <div className={`p - 4 border rounded - lg flex items - center gap - 4 ${person.assignedMentorName ? 'bg-blue-50 border-blue-200' : 'border-slate-200'} `}>
                                        <div className={`w - 10 h - 10 rounded - full flex items - center justify - center ${person.assignedMentorName ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'} `}>
                                            {person.assignedMentorName ? <UserCheck size={20} /> : <Award size={20} />}
                                        </div>
                                        <div>
                                            <p className={`font - bold ${person.assignedMentorName ? 'text-blue-800' : 'text-slate-800'} `}>
                                                {person.assignedMentorName ||
                                                    (analytics.profile === 'C' ? 'Consejero/a Experimentado/a' :
                                                        analytics.profile === 'A' ? 'Líder de Ministerio' : 'Discípulo Maduro (Par)')}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {person.assignedMentorName ? 'Responsable de seguimiento oficial' : 'Perfil sugerido para acompañamiento'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Notas Pastorales y Observaciones</h4>
                                    {person.pastoralNotes ? (
                                        <div className="w-full h-48 border border-amber-200 rounded-xl bg-amber-50/50 p-4 relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl"></div>
                                            <p className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed italic">
                                                "{person.pastoralNotes}"
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 border border-slate-200 rounded-xl bg-slate-50/50 p-4 space-y-6">
                                            <div className="border-b border-slate-200 h-6"></div>
                                            <div className="border-b border-slate-200 h-6"></div>
                                            <div className="border-b border-slate-200 h-6"></div>
                                            <div className="border-b border-slate-200 h-6"></div>
                                            <div className="border-b border-slate-200 h-6"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                    <div className="text-xs">
                                        <span className="block font-bold text-slate-400 uppercase tracking-widest">Próxima Evaluación</span>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-lg">
                                                {person.evaluations && person.evaluations[0]?.nextAction
                                                    ? new Date(person.evaluations[0].nextAction).toLocaleDateString()
                                                    : (analytics.profile === 'C' ? '15 Días' : '3 Meses')}
                                            </span>
                                            {person.evaluations && person.evaluations[0]?.nextAction && (
                                                <span className="text-[9px] font-bold text-indigo-500 uppercase">
                                                    Agendada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-300 uppercase font-bold">Firma del Mentor / Pastor</span>
                                        <div className="w-40 border-b-2 border-slate-200 mt-8"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FOOTER */}
                    <footer className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 uppercase font-medium">
                        Generado por Sistema de Gestión Pastoral • {new Date().getFullYear()} • Uso Interno Confidencial
                    </footer>

                </div>
            </div>
        </div>
    );
};

export default MemberReportView;
