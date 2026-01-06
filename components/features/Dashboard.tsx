import React, { useState, useMemo } from 'react';
import {
  Users, Activity, Heart, Calendar as CalendarIcon,
  ArrowRight, MapPin, BarChart3, PieChart, Info, AlertOctagon,
  UserCheck, User, Baby, CheckCircle2, List, X, FileText, ClipboardCheck, BookOpen, Target, Database, MailPlus, CloudFog, CloudLightning, Cloud as CloudIcon
} from 'lucide-react';
import { Person, SurveyResponse, SurveyTemplate, DemographicStats, CalendarEvent, AppConfig } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

interface DashboardProps {
  people: Person[];
  responses: SurveyResponse[];
  templates: SurveyTemplate[];
  events: CalendarEvent[];
  setActiveTab: (tab: string) => void;
  config?: AppConfig;
  onNavigateToMember?: (id: number, mode?: 'profile' | 'report') => void;
  onManualBackup?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ people, responses, templates, events, setActiveTab, config, onNavigateToMember, onManualBackup }) => {
  const [selectedSurveyForParticipants, setSelectedSurveyForParticipants] = useState<number | null>(null);
  const [internalTab, setInternalTab] = useState<'general' | 'new-members'>('general');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]); // To store imported requests temporarily
  const [dragActive, setDragActive] = useState(false);

  // --- 1. MEMBER BREAKDOWN LOGIC ---
  const safePeople = Array.isArray(people) ? people.filter(p => !!p) : [];

  function calculateAge(birthDate: string) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  }

  const memberChildren = safePeople.filter(p => calculateAge(p.birthDate) <= 12);
  const memberYouth = safePeople.filter(p => { const age = calculateAge(p.birthDate); return age >= 13 && age <= 29; });
  const memberAdults = safePeople.filter(p => calculateAge(p.birthDate) >= 30);

  let extraChildrenCount = 0;
  let extraYouthCount = 0;
  let extraAdultCount = 0;
  let cargaCount = 0;

  safePeople.forEach(p => {
    if (p.childrenList && p.childrenList.length > 0) {
      p.childrenList.forEach(c => {
        if (!c.congregates) {
          cargaCount++;
        } else {
          const age = c.age || 0;
          if (age <= 12) extraChildrenCount++;
          else if (age <= 29) extraYouthCount++;
          else extraAdultCount++;
        }
      });
    } else if (p.numberOfChildren && p.numberOfChildren > 0) {
      cargaCount += p.numberOfChildren;
    }
  });

  const totalChildren = memberChildren.length + extraChildrenCount;
  const totalYouth = memberYouth.length + extraYouthCount;
  const totalAdults = memberAdults.length + extraAdultCount;
  const totalCommunity = totalChildren + totalYouth + totalAdults;

  const activeMembers = safePeople.filter(p => p.status === 'Activo');
  const membersByLocal = activeMembers.reduce((acc, curr) => {
    const localName = curr.local || 'Iglesia Matriz';
    acc[localName] = (acc[localName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeResponses = useMemo(() => {
    return responses.filter(r => [100, 101, 102, 103, 104, 105].includes(r.templateId));
  }, [responses]);

  // --- INDICES & METRICS ---
  const recentSurveys = Array.isArray(templates) ? templates.slice(0, 5) : [];
  const getParticipantsForSurvey = (templateId: number) => {
    const ResponseIds = responses.filter(r => r.templateId === templateId).map(r => r.personId);
    const uniqueIds = Array.from(new Set(ResponseIds));
    return people.filter(p => uniqueIds.includes(p.id));
  };

  const relevantCategories = config?.surveyCategories
    ?.filter(c => c.includeInStats)
    .map(c => c.name) || ['BÁSICO', 'INTERMEDIO', 'AVANZADO', 'ANUAL'];

  const relevantTemplates = templates.filter(t => relevantCategories.includes(t.category));
  const relevantTemplateIds = relevantTemplates.map(t => t.id);
  const relevantResponses = responses.filter(r => relevantTemplateIds.includes(r.templateId) && typeof r.score === 'number');

  const avgSurveyScore = relevantResponses.length > 0
    ? relevantResponses.reduce((acc, curr) => acc + (curr.score || 0), 0) / relevantResponses.length
    : 75;

  const activePercentage = (activeMembers.length / (people.length || 1)) * 100;
  const ministryPercentage = (people.filter(p => p.ministries && p.ministries.length > 0).length / (people.length || 1)) * 100;
  const healthIndex = Math.round((avgSurveyScore * 0.4) + (activePercentage * 0.3) + (ministryPercentage * 0.3));

  // --- DEEP NEW MEMBERS ANALYSIS LOGIC (STRATEGY IMPLEMENTATION) ---
  const newMemberStats = useMemo(() => {
    const targetResponses = responses.filter(r => r.templateId === 201);
    if (targetResponses.length === 0) return null;

    let foundationTotalStart = 0;
    let holySpiritReadyCount = 0;

    // Stats for Health Summary Table
    let activeDevotionalCount = 0;
    let cantPrayCount = 0;
    let longTermCount = 0;
    let feelingGrowthCount = 0;

    const barriersCounts = { cantPray: 0, needSupport: 0, needBible: 0, work: 0, distance: 0, uncomfortable: 0 };
    const windowsCounts = { discipleship: 0, service: 0, wait: 0 };
    const profiles = { A: 0, B: 0, C: 0, D: 0 };

    // Matrix simplified tracking (Legacy support)
    let integratedCount = 0;
    let processCount = 0;
    let riskCount = 0;

    // Indices tracking
    let integrationSum = 0;
    let growthSum = 0;
    let commitmentSum = 0;

    const getAns = (r: SurveyResponse, id: number) => String(r.answers.find(a => a.questionId === id)?.value || '');
    const hasOpt = (r: SurveyResponse, id: number, text: string) => getAns(r, id).toUpperCase().includes(text);

    targetResponses.forEach(r => {
      // --- 1. METRIC: FUNDAMENTO ESPIRITUAL (0-100) ---
      // P2 (20104): Experience
      let p2 = 0;
      if (hasOpt(r, 20104, 'ASISTÍ')) p2 = 75;
      else if (hasOpt(r, 20104, 'LEÍA')) p2 = 50;
      else if (hasOpt(r, 20104, 'ALGO')) p2 = 25;

      // P5 (20107): Growth Feeling
      let p5 = 0;
      if (getAns(r, 20107) === 'VERDADERO') { p5 = 100; feelingGrowthCount++; }
      else if (getAns(r, 20107) === 'NO LO SÉ') p5 = 50;

      // P17 (20119): Devotional Life
      let p17 = 0;
      const a17 = getAns(r, 20119).toUpperCase();
      if (a17.includes('CASI TODOS')) { p17 = 100; activeDevotionalCount++; }
      else if (a17.includes('ALGUNAS')) { p17 = 75; activeDevotionalCount++; } // Count a/b as active
      else if (a17.includes('OCASIONALMENTE')) p17 = 50;
      else if (a17.includes('SOLO')) p17 = 25;
      else if (a17.includes('No sé')) cantPrayCount++;

      // P19 (20121): Understanding
      let p19 = 0;
      if (hasOpt(r, 20121, 'MAYORÍA')) p19 = 100;
      else if (hasOpt(r, 20121, 'ALGUNAS')) p19 = 75;
      else if (hasOpt(r, 20121, 'CUESTA')) p19 = 25;

      const foundationAvg = (p2 + p5 + p17 + p19) / 4;
      foundationTotalStart += foundationAvg;


      // --- 2. METRIC: ESPIRITU SANTO READINESS ---
      const p6_changes = !hasOpt(r, 20108, 'AÚN NO');
      const p9_baptism = hasOpt(r, 20111, 'YA ESTOY') || hasOpt(r, 20111, 'GUSTARÍA');
      const p17_prayer = p17 >= 50; // Active prayer life

      if (p6_changes && p9_baptism && p17_prayer) holySpiritReadyCount++;


      // --- 3. PROFILES Logic (Refined) ---
      const p8_mentor = hasOpt(r, 20110, 'MENTOR') || hasOpt(r, 20110, 'TODAS');
      const isCrisis = hasOpt(r, 20122, 'NECESIDAD') || hasOpt(r, 20117, 'APOYO ESPIRITUAL'); // P18/P15 equivalents
      const isRelational = hasOpt(r, 20103, 'AMIGO') || hasOpt(r, 20122, 'INFLUENCIA');

      // Profile A: Sediento (Growth + Changes + Prayer + Mentor/Baptism)
      if (p5 === 100 && p6_changes && p17 >= 75 && p9_baptism) profiles.A++;
      // Profile C: Crisis (Explicit need)
      else if (isCrisis) profiles.C++;
      // Profile D: Relational (Invited by friend + Low foundation/No growth feeling)
      else if (isRelational && foundationAvg < 50) profiles.D++;
      // Profile B: Explorador (Default for others)
      else profiles.B++;


      // --- 4. EXTRAS ---
      if (hasOpt(r, 20118, 'CASA') || hasOpt(r, 20118, 'CRECER')) longTermCount++;


      // Legacy Integration/Commitment Sums (kept for compatibility with UI)
      integrationSum += foundationAvg; // Proxy
      // Commitment
      let comm = 0;
      if (p9_baptism) comm += 40;
      if (getAns(r, 20114) === 'VERDADERO') comm += 30; // Active part
      if (p17 >= 75) comm += 30;
      commitmentSum += comm;

      // Barriers
      if (a17.includes('NO SÉ')) barriersCounts.cantPray++;
      if (hasOpt(r, 20117, 'APOYO')) barriersCounts.needSupport++;
      if (hasOpt(r, 20117, 'ENTENDER')) barriersCounts.needBible++;
      if (hasOpt(r, 20113, 'TRABAJO')) barriersCounts.work++;
      if (hasOpt(r, 20113, 'DISTANCIA')) barriersCounts.distance++;
      if (hasOpt(r, 20113, 'CÓMODO')) barriersCounts.uncomfortable++;

      // Windows
      if (getAns(r, 20114) === 'VERDADERO') windowsCounts.discipleship++;
      if (!getAns(r, 20115).includes('NO ME SIENTO LISTO')) windowsCounts.service++;
    });

    const count = targetResponses.length;

    return {
      foundationIndex: Math.round(foundationTotalStart / count),
      hsReadyPercent: Math.round((holySpiritReadyCount / count) * 100),
      health: {
        foundationSolid: Math.round((targetResponses.filter(r => {
          // Re-calc foundation for specific filter would be expensive, approximating via average is bad.
          // Ideally we'd store the scores. Let's do a simple count above if needed or just return aggregates.
          return true;
        }).length / count) * 100), // Placeholder, using aggregate averages
        cantPray: Math.round((cantPrayCount / count) * 100),
        activeDevotional: Math.round((activeDevotionalCount / count) * 100),
        longTerm: Math.round((longTermCount / count) * 100),
        feelingGrowth: Math.round((feelingGrowthCount / count) * 100),
      },
      indices: {
        integration: Math.round(integrationSum / count),
        growth: Math.round(growthSum / count),
        commitment: Math.round(commitmentSum / count)
      },
      barriers: {
        cantPray: Math.round((barriersCounts.cantPray / count) * 100),
        needSupport: Math.round((barriersCounts.needSupport / count) * 100),
        needBible: Math.round((barriersCounts.needBible / count) * 100),
        work: Math.round((barriersCounts.work / count) * 100),
        distance: Math.round((barriersCounts.distance / count) * 100),
        uncomfortable: Math.round((barriersCounts.uncomfortable / count) * 100),
      },
      windows: {
        discipleship: Math.round((windowsCounts.discipleship / count) * 100),
        service: Math.round((windowsCounts.service / count) * 100),
        wait: Math.round((windowsCounts.wait / count) * 100),
      },
      profiles: {
        A: Math.round((profiles.A / count) * 100),
        B: Math.round((profiles.B / count) * 100),
        C: Math.round((profiles.C / count) * 100),
        D: Math.round((profiles.D / count) * 100),
      },
      total: count
    };
  }, [responses]);

  // --- TRANSITION 2026 ANALYSIS LOGIC (ID 100) ---
  const transitionStats = useMemo(() => {
    // Only target ID 100 (The Unified Survey)
    const targetResponses = responses.filter(r => r.templateId === 100);
    // Fallback: If no ID 100, try legacy IDs if needed, but for now strict.
    // Return null to use fallbacks defined below.
    if (targetResponses.length === 0) return null;

    const getAns = (r: SurveyResponse, id: number) => String(r.answers.find(a => a.questionId === id)?.value || '');
    const hasOpt = (r: SurveyResponse, id: number, text: string) => getAns(r, id).toUpperCase().includes(text);

    let hopeSum = 0;
    let changeSum = 0;
    let trustSum = 0;

    const alerts = {
      communication: 0,
      spiritual: 0,
      weakness: 0,
      leadership: 0
    };

    targetResponses.forEach(r => {
      // 1. ESPERANZA: Q10110 (Optimismo) + Q10312 (Buenos Tiempos)
      let h = 0;
      if (hasOpt(r, 10110, 'SÍ')) h += 50;
      if (hasOpt(r, 10312, 'SÍ')) h += 50;
      hopeSum += h;

      // 2. ADAPTABILIDAD: Q10302 (Cambios) + Q10512 (Confianza Liderazgo)
      let c = 0;
      if (hasOpt(r, 10302, 'SÍ')) c += 60;
      else if (getAns(r, 10303).length > 2) c += 20; // Has expectations
      if (hasOpt(r, 10512, 'SÍ')) c += 40;
      changeSum += c;

      // 3. LIDERAZGO: Q10502 (Cuidado) + Q10511 (Transparencia) + Q10512 (Confianza)
      let t = 0;
      const likert = parseInt(getAns(r, 10502).split('-')[0]) || 0; // "5 - MUCHO" -> 5
      t += (likert / 5) * 40; // Max 40
      if (hasOpt(r, 10511, 'SÍ')) t += 30;
      if (hasOpt(r, 10512, 'SÍ')) t += 30;
      trustSum += t;

      // ALERTS CHECK
      if (hasOpt(r, 10206, 'NO')) alerts.communication++;
      if (hasOpt(r, 10212, 'NO')) alerts.spiritual++;
      if (hasOpt(r, 10201, 'INFRAESTRUCTURA')) alerts.weakness++;
      if (hasOpt(r, 10406, 'NO')) alerts.leadership++;
    });

    const count = targetResponses.length;
    return {
      indices: {
        hope: Math.round(hopeSum / count),
        change: Math.round(changeSum / count),
        trust: Math.round(trustSum / count)
      },
      alerts: {
        communication: Math.round((alerts.communication / count) * 100),
        spiritual: Math.round((alerts.spiritual / count) * 100),
        weakness: Math.round((alerts.weakness / count) * 100),
        leadership: Math.round((alerts.leadership / count) * 100),
      },
      total: count,
      hasData: true
    };
  }, [responses]);

  // Safe Accessors for UI (Fallback to defaults if no Survey 100 data)
  const tStats = transitionStats || {
    indices: { hope: Math.round(avgSurveyScore), change: Math.round(healthIndex * 0.9), trust: Math.round(avgSurveyScore * 1.1) },
    alerts: { communication: 0, spiritual: 0, weakness: 0, leadership: 0 },
    hasData: false
  };

  /* --- NEW: MEMBERS IN TRACKING WIDGET --- */
  const membersInTracking = safePeople.filter(p => (p.evaluations && p.evaluations.length > 0) || p.status === 'Seguimiento');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* TRACKING ALERT BANNER */}
      {membersInTracking.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 text-sm">Procesos de Seguimiento Activos</h3>
              <p className="text-xs text-amber-600">Hay <span className="font-black">{membersInTracking.length}</span> miembros con evaluaciones o en etapa de seguimiento.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('members')}
            className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
          >
            Ver Miembros
          </button>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel Principal</h2>
          <p className="text-slate-500 font-medium">Resumen general de la congregación y salud espiritual.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('members')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <UserCheck size={18} />
            Gestionar Miembros
          </button>

          {/* BOTON DE RESPALDO (SOLICITADO) */}
          {onManualBackup && (
            <button onClick={() => {
              const btn = document.getElementById('backup-btn-text');
              if (btn) btn.innerText = "Guardando...";
              onManualBackup().then(() => {
                if (btn) btn.innerText = "¡Respaldado!";
                setTimeout(() => { if (btn) btn.innerText = "Forzar Respaldo"; }, 2000);
              });
            }} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-900 transition-all flex items-center gap-2 border border-slate-700">
              <Database size={18} className="text-emerald-400" />
              <span id="backup-btn-text">Forzar Respaldo</span>
            </button>
          )}

          <button onClick={() => setActiveTab('calendar')} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <CalendarIcon size={18} />
            Ver Calendario
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setInternalTab('general')}
            className={`px-6 py-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${internalTab === 'general' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            General
          </button>
          <button
            onClick={() => setInternalTab('new-members')}
            className={`relative px-6 py-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${internalTab === 'new-members' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'} `}
          >
            <div className={`w-2 h-2 rounded-full ${internalTab === 'new-members' ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
            Nuevos Miembros
          </button>
        </div>
        <button
          onClick={() => setIsInboxOpen(true)}
          className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
        >
          <MailPlus size={16} /> Solicitudes
        </button>
        {onManualBackup && (
          <button
            onClick={onManualBackup}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors"
          >
            <Database size={16} /> Forzar Respaldo
          </button>
        )}
      </div>

      {/* --- GENERAL TAB CONTENT --- */}
      {internalTab === 'general' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* 1. MEMBER TOTALS (Compacted Row) */}
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Total Congregating */}
            <div className="col-span-2 lg:col-span-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-200 font-bold uppercase text-[10px] tracking-wider mb-0.5">Total Hermandad</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tight">{totalCommunity}</h3>
                  <span className="text-xs font-medium text-blue-300">{Math.round((activeMembers.length / (totalCommunity || 1)) * 100)}% Activos</span>
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <Users size={20} className="text-white" />
              </div>
            </div>

            {/* Cargas */}
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-1 group hover:border-cyan-200 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Niños (Cargas)</p>
                <Baby size={14} className="text-cyan-500" />
              </div>
              <h3 className="text-xl font-black text-slate-700">{cargaCount}</h3>
              <div className="h-0.5 w-full bg-slate-100 rounded-full"><div className="h-full bg-cyan-400 w-full opacity-50"></div></div>
            </div>

            {/* Adults */}
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-1 group hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Adultos</p>
                <User size={14} className="text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-slate-700">{totalAdults}</h3>
              <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(totalAdults / totalCommunity) * 100}% ` }}></div>
              </div>
            </div>

            {/* Youth */}
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-1 group hover:border-purple-200 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Jóvenes</p>
                <Activity size={14} className="text-purple-500" />
              </div>
              <h3 className="text-xl font-black text-slate-700">{totalYouth}</h3>
              <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${(totalYouth / totalCommunity) * 100}% ` }}></div>
              </div>
            </div>

            {/* Children */}
            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-1 group hover:border-amber-200 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Niñez</p>
                <Baby size={14} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-slate-700">{totalChildren}</h3>
              <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${(totalChildren / totalCommunity) * 100}% ` }}></div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* --- 2. LOCAL DISTRIBUTION & HEALTH --- */}
            <div className="lg:col-span-1 space-y-8">
              {/* Local Distribution */}
              <Card title="Miembros por Local" icon={<MapPin className="text-rose-500" />} className="border-slate-100">
                <div className="space-y-4 pt-4">
                  {Object.entries(membersByLocal).map(([local, count]: [string, number]) => (
                    <div key={local} className="space-y-2 group cursor-pointer">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-slate-700 uppercase text-xs tracking-wide group-hover:text-blue-600 transition-colors">{local}</span>
                        <span className="font-black text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 group-hover:scale-[1.01]"
                          style={{ width: `${(count / activeMembers.length) * 100}% ` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(membersByLocal).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4 italic">No hay miembros activos asignados a locales.</p>
                  )}
                </div>
              </Card>

              {/* Ministry Distribution */}
              <Card title="Participación Ministerial" icon={<Heart className="text-pink-500" />} className="border-slate-100">
                <div className="space-y-4 pt-4">
                  {(() => {
                    const ministryCounts: Record<string, number> = {};
                    activeMembers.forEach(m => {
                      if (m.ministries) {
                        m.ministries.forEach(min => {
                          ministryCounts[min] = (ministryCounts[min] || 0) + 1;
                        });
                      }
                    });
                    const sortedMinistries = Object.entries(ministryCounts).sort((a, b) => b[1] - a[1]);

                    if (sortedMinistries.length === 0) return <p className="text-center text-slate-400 text-sm py-4 italic">No hay registros ministeriales.</p>;

                    return sortedMinistries.map(([min, count]) => (
                      <div key={min} className="space-y-2 group cursor-pointer">
                        <div className="flex justify-between items-end">
                          <span className="font-bold text-slate-700 uppercase text-xs tracking-wide group-hover:text-pink-600 transition-colors">{min}</span>
                          <span className="font-black text-slate-900">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000 group-hover:scale-[1.01]"
                            style={{ width: `${(count / activeMembers.length) * 100}% ` }}
                          ></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </Card>

              {/* Survey Participation */}
              <Card title="Participación en Encuestas" icon={<List className="text-emerald-500" />} className="border-slate-100">
                <div className="space-y-1 pt-2">
                  <div className="grid grid-cols-3 text-[10px] font-black uppercase text-slate-400 tracking-widest pb-2 border-b border-slate-100 mb-2">
                    <div className="col-span-2">Nombre Encuesta</div>
                    <div className="text-right">Participación</div>
                  </div>
                  {recentSurveys.length > 0 ? recentSurveys.map(survey => {
                    const count = responses.filter(r => r.templateId === survey.id).length;
                    return (
                      <div key={survey.id} className="grid grid-cols-3 items-center py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors px-2 rounded-lg -mx-2">
                        <div className="col-span-2">
                          <p className="font-bold text-slate-700 text-sm">{survey.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{survey.category}</p>
                        </div>
                        <div className="flex justify-end items-center gap-3">
                          <span className="font-black text-slate-800">{count} Resp.</span>
                          <button
                            onClick={() => setSelectedSurveyForParticipants(survey.id)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Ver Participantes"
                          >
                            <UserCheck size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center text-slate-400 text-sm py-8">No hay encuestas activas aún.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* --- COLUMNS 2,3,4: TRANSITION DASHBOARD (75%) --- */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 2.1 MAIN PANEL (Takes 2/3 of this section -> 50% of total screen) */}
              <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col justify-between p-0">
                {/* Vibrant Background Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

                <div className="p-8 relative z-10 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/20">
                      <BarChart3 size={28} className="text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase tracking-[0.2em] text-sm text-indigo-100/80">Panel de Control</h3>
                      <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        TRANSICIÓN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300">2026</span>
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 items-stretch">
                    {/* INDICATOR 1: INDICE DE ESPERANZA */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="text-white/50 -rotate-45" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Esperanza</span>
                        {(() => {
                          const hopeScore = tStats.indices.hope > 80 ? 'ALTO' : tStats.indices.hope > 50 ? 'MEDIO' : 'BAJO';
                          const color = hopeScore === 'ALTO' ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' : hopeScore === 'MEDIO' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
                          return <div className={`w - 4 h - 4 rounded - full ${color} `}></div>
                        })()}
                      </div>
                      <div className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200 group-hover:scale-110 transition-transform origin-left duration-300 filter drop-shadow-sm">
                        {tStats.indices.hope}<span className="text-3xl text-indigo-300/50">%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${tStats.indices.hope}% ` }}></div>
                      </div>
                      <p className="text-[11px] text-indigo-100/70 font-medium leading-relaxed">Confianza y optimismo proyectado hacia el futuro.</p>
                    </div>

                    {/* INDICATOR 2: PREPARACIÓN PARA EL CAMBIO */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Activity className="text-white/50" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-200">Adaptabilidad</span>
                        {(() => {
                          const status = tStats.indices.change > 75 ? 'LISTO' : tStats.indices.change > 45 ? 'PROCESO' : 'RESISTENCIA';
                          const color = status === 'LISTO' ? 'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.6)]' : status === 'PROCESO' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
                          return <div className={`w - 4 h - 4 rounded - full ${color} `}></div>
                        })()}
                      </div>
                      <div className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-fuchsia-200 group-hover:scale-110 transition-transform origin-left duration-300 filter drop-shadow-sm">
                        {tStats.indices.change}<span className="text-3xl text-fuchsia-300/50">%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                        <div className="h-full bg-fuchsia-400 rounded-full" style={{ width: `${tStats.indices.change}% ` }}></div>
                      </div>
                      <p className="text-[11px] text-fuchsia-100/70 font-medium leading-relaxed">Flexibilidad y apertura a nuevos modelos.</p>
                    </div>

                    {/* INDICATOR 3: CONEXIÓN PASTORAL */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="text-white/50" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">Liderazgo</span>
                        {(() => {
                          const color = tStats.indices.trust > 80 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' : tStats.indices.trust > 60 ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
                          return <div className={`w - 4 h - 4 rounded - full ${color} `}></div>
                        })()}
                      </div>
                      <div className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-200 group-hover:scale-110 transition-transform origin-left duration-300 filter drop-shadow-sm">
                        {tStats.indices.trust}<span className="text-3xl text-emerald-300/50">%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${tStats.indices.trust}% ` }}></div>
                      </div>
                      <p className="text-[11px] text-emerald-100/70 font-medium leading-relaxed">Respaldo y conexión con el cuerpo pastoral.</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ACTIONABLE INSIGHT BOX */}
              <div className="flex flex-col gap-6">
                <Card className="flex-1 bg-white border border-slate-200 shadow-sm p-0 overflow-hidden flex flex-col">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide text-xs">
                      <AlertOctagon size={16} className="text-amber-500" /> Focos de Atención
                    </h4>
                    {Object.values(tStats.alerts).some((v: any) => (v as number) > 20) && <Badge color="amber">Requiere Acción</Badge>}
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    {tStats.hasData ? (
                      <>
                        {tStats.alerts.communication > 30 && (
                          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
                            <div className="flex gap-3">
                              <div className="mt-1 min-w-[3px] h-full rounded-full bg-amber-400/50"></div>
                              <div>
                                <p className="text-xs font-black text-amber-900 uppercase tracking-wide">Comunicación</p>
                                <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">El <span className="font-bold">{tStats.alerts.communication}%</span> reporta fallas en la difusión de actividades.</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {tStats.alerts.spiritual > 20 && (
                          <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 hover:border-rose-200 transition-colors">
                            <div className="flex gap-3">
                              <div className="mt-1 min-w-[3px] h-full rounded-full bg-rose-400/50"></div>
                              <div>
                                <p className="text-xs font-black text-rose-900 uppercase tracking-wide">Bienestar Espiritual</p>
                                <p className="text-[11px] text-rose-800/80 mt-1 leading-relaxed">El <span className="font-bold">{tStats.alerts.spiritual}%</span> siente que sus necesidades no son atendidas.</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {tStats.alerts.weakness > 30 && (
                          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors">
                            <div className="flex gap-3">
                              <div className="mt-1 min-w-[3px] h-full rounded-full bg-blue-400/50"></div>
                              <div>
                                <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Infraestructura</p>
                                <p className="text-[11px] text-blue-800/80 mt-1 leading-relaxed">Identificada como área débil por el <span className="font-bold">{tStats.alerts.weakness}%</span>.</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Fallback if no specific alerts but data exists */}
                        {Object.values(tStats.alerts).every((v: any) => (v as number) <= 20) && (
                          <p className="text-center text-slate-400 italic text-xs py-4">No se detectan focos críticos actualmente.</p>
                        )}
                      </>
                    ) : (
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                        <p className="text-xs text-slate-400 italic">Datos insuficientes para generar insights del Diagnóstico 2026.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Ver todos los insights</button>
                  </div>
                </Card>

                {/* Quick Actions (Sidebar) */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-wide"><ArrowRight size={14} className="text-blue-500" /> Accesos Directos</h4>
                  <div className="space-y-2">
                    <button onClick={() => setActiveTab('surveys')} className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-[10px] font-bold uppercase tracking-wide text-slate-600 flex items-center justify-between group">
                      Crear Nueva Encuesta
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </button>
                    <button onClick={() => setActiveTab('members')} className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-[10px] font-bold uppercase tracking-wide text-slate-600 flex items-center justify-between group">
                      Registrar Visita
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* VISUAL CHARTS ROW */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: Areas of Improvement */}
              {/* UPCOMING EVENTS WIDGET */}
              <div className="lg:col-span-1">
                <Card title="Próximos Eventos" icon={<CalendarIcon className="text-blue-500" />} className="bg-white border-slate-100 shadow-sm h-full">
                  <div className="space-y-4 pt-4">
                    {events
                      .filter(e => new Date(e.startDate) >= new Date())
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .slice(0, 3)
                      .map(e => (
                        <div key={e.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setActiveTab('calendar')}>
                          <div className="min-w-[50px] text-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                            <span className="block text-xs font-black text-slate-400 uppercase">{new Date(e.startDate).toLocaleDateString('es-CL', { month: 'short' })}</span>
                            <span className="block text-xl font-black text-slate-800">{new Date(e.startDate).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-700 text-sm line-clamp-1">{e.title}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1">
                              {new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {e.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    {events.filter(e => new Date(e.startDate) >= new Date()).length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-8 italic">No hay eventos próximos.</p>
                    )}
                    <button onClick={() => setActiveTab('calendar')} className="w-full py-2 text-xs font-bold text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-colors">
                      Ver Calendario Completo
                    </button>
                  </div>
                </Card>
              </div>

              <Card className="bg-white border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-500" /> Prioridades de Mejora
                  </h4>
                  <Badge color="blue">Top 3</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Infraestructura</span>
                      <span>45%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[45%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Evangelismo</span>
                      <span>30%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 w-[30%] rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Discipulado</span>
                      <span>15%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-300 w-[15%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chart 2: Leadership Model */}
              <Card className="bg-white border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs flex items-center gap-2">
                    <PieChart size={16} className="text-indigo-500" /> Preferencia de Liderazgo
                  </h4>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 flex gap-1 h-32 items-end">
                    <div className="w-1/4 bg-indigo-200 h-[30%] rounded-t-lg relative group">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">15%</span>
                    </div>
                    <div className="w-1/4 bg-indigo-500 h-[60%] rounded-t-lg relative group">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">60%</span>
                    </div>
                    <div className="w-1/4 bg-indigo-300 h-[40%] rounded-t-lg relative group">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">25%</span>
                    </div>
                    <div className="w-1/4 bg-slate-100 h-[10%] rounded-t-lg relative group">
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">5%</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px] font-bold uppercase text-slate-500">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Equipo Líder</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-300"></div> Ancianos</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-200"></div> Pastor Trad.</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Acciones de Reporte */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={16} /> Generar Reportes
              </h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Descarga los resultados detallados para análisis administrativo.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // CSV Generation Logic
                    const headers = ['Fecha', 'Miembro', 'Tipo de Encuesta', 'Resultado Clave', 'Estado'];
                    const rows = activeResponses.map(r => {
                      const p = people.find(p => p.id === r.personId);
                      const t = templates.find(t => t.id === r.templateId);
                      // Simple result parsing logic (extensible)
                      return [
                        new Date(r.updatedAt).toLocaleDateString(),
                        p?.name || 'Desconocido',
                        t?.name || 'Encuesta',
                        'Completada',
                        'Válido'
                      ].join(',');
                    });

                    const csvContent = "data:text/csv;charset=utf-8,"
                      + [headers.join(','), ...rows].join('\n');

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `reporte_ministerial_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <List size={14} /> Taba de Datos (CSV)
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> Imprimir / PDF Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW MEMBERS TAB CONTENT --- */}
      {internalTab === 'new-members' && (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
          {!newMemberStats ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hay encuestas de Nuevos Miembros registradas aún</p>
              <button onClick={() => setActiveTab('surveys')} className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase hover:bg-blue-200 transition-colors">
                Ir a Encuestas para Iniciar
              </button>
            </div>
          ) : (
            <>
              {/* --- HEALTH SUMMARY TABLE (NEW STRATEGY) --- */}
              <div className="mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" /> Resumen de Salud (Diagnóstico Estratégico)
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="neutral">Meta: Saludable</Badge>
                  </div>
                </div>
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest bg-slate-50/50">
                        <th className="px-6 py-3 font-black">Métrica Clave</th>
                        <th className="px-6 py-3 font-black text-center">Estado Actual</th>
                        <th className="px-6 py-3 font-black text-right">Resultado</th>
                        <th className="px-6 py-3 font-black text-right hidden md:table-cell">Meta Saludable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {/* 1. Fundamento Sólido */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">Miembros con Fundamento Sólido</td>
                        <td className="px-6 py-4 text-center">
                          {newMemberStats.foundationIndex >= 75 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide">
                              <CheckCircle2 size={12} /> Saludable
                            </span>
                          ) : newMemberStats.foundationIndex >= 50 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide">
                              <AlertOctagon size={12} /> Atención
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wide">
                              <X size={12} /> Crisis
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{newMemberStats.foundationIndex} pts</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs hidden md:table-cell">&gt; 75 pts</td>
                      </tr>
                      {/* 2. Listos para Espíritu Santo */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">Listos para el Espíritu Santo</td>
                        <td className="px-6 py-4 text-center">
                          {newMemberStats.hsReadyPercent >= 30 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide">
                              <CheckCircle2 size={12} /> Óptimo
                            </span>
                          ) : newMemberStats.hsReadyPercent >= 15 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide">
                              <AlertOctagon size={12} /> Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wide">
                              <X size={12} /> Crítico
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{newMemberStats.hsReadyPercent}%</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs hidden md:table-cell">30 - 40%</td>
                      </tr>
                      {/* 3. Vida Devocional Activa */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">Vida Devocional Activa</td>
                        <td className="px-6 py-4 text-center">
                          {newMemberStats.health.activeDevotional >= 40 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide">
                              <CheckCircle2 size={12} /> Saludable
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wide">
                              <AlertOctagon size={12} /> Requiere Foco
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{newMemberStats.health.activeDevotional}%</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs hidden md:table-cell">&gt; 40%</td>
                      </tr>
                      {/* 4. No sabe orar (Crisis) */}
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-rose-700">Barrera: No sabe orar/leer Biblia</td>
                        <td className="px-6 py-4 text-center">
                          {newMemberStats.health.cantPray < 20 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide">
                              <CheckCircle2 size={12} /> Controlado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wide">
                              <AlertOctagon size={12} /> ALERTA
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">{newMemberStats.health.cantPray}%</td>
                        <td className="px-6 py-4 text-right text-slate-400 text-xs hidden md:table-cell">&lt; 20%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOP ROW: FUNDAMENT & HOLY SPIRIT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Spiritual Foundation */}
                <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white border-none shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-300 mb-2">Fundamento Espiritual</h3>
                    <div className="flex items-end gap-3 mb-4">
                      <span className="text-5xl font-black">{newMemberStats.foundationIndex}</span>
                      <span className="text-xl font-bold text-indigo-300 mb-1">/ 100</span>
                    </div>
                    {/* Level Interpretation */}
                    <div className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-bold uppercase mb-4">
                      {newMemberStats.foundationIndex >= 75 ? 'Fundamento Sólido' :
                        newMemberStats.foundationIndex >= 50 ? 'En Desarrollo' :
                          newMemberStats.foundationIndex >= 25 ? 'Fundamento Débil' : 'Sin Fundamento'}
                    </div>
                    <p className="text-xs text-indigo-200 max-w-sm leading-relaxed">
                      Promedio basado en experiencia previa, sentimiento de crecimiento, vida devocional y comprensión bíblica.
                    </p>
                  </div>
                </Card>

                {/* 2. Holy Spirit Readiness & Growth Projection */}
                <div className="space-y-6">
                  <Card className="bg-white border-slate-100 relative overflow-hidden">
                    <div className={`absolute top - 0 right - 0 w - 32 h - 32 rounded - bl - full opacity - 10 ${newMemberStats.hsReadyPercent >= 40 ? 'bg-emerald-500' : 'bg-amber-500'} `}></div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Activity size={18} /> Disposición Espíritu Santo
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * newMemberStats.hsReadyPercent / 100)}
                              className={`${newMemberStats.hsReadyPercent >= 35 ? 'text-emerald-500' : 'text-amber-500'} transition - all duration - 1000`}
                            />
                          </svg>
                          <span className="absolute text-2xl font-black text-slate-800">{newMemberStats.hsReadyPercent}%</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-2">Meta Saludable: 30-40%</p>
                          <ul className="space-y-1 text-xs text-slate-600">
                            <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Buscando Bautismo</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Vida de Oración Activa</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Growth PROJECTION Chart (Simulation based on Habits) */}
                  <Card className="bg-white border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                      <BarChart3 size={16} /> Proyección de Crecimiento
                    </h3>
                    <div className="flex items-end gap-2 h-24 mt-4">
                      <div className="w-1/4 bg-slate-100 rounded-t-lg h-[30%] relative group">
                        <span className="absolute -top-4 text-[9px] text-slate-400 w-full text-center">Incio</span>
                      </div>
                      <div className="w-1/4 bg-blue-100 rounded-t-lg h-[50%] relative group">
                        <span className="absolute -top-4 text-[9px] text-blue-400 w-full text-center">3m</span>
                      </div>
                      <div className="w-1/4 bg-blue-300 rounded-t-lg h-[70%] relative group">
                        <span className="absolute -top-4 text-[9px] text-blue-500 w-full text-center">6m</span>
                      </div>
                      <div className={`w - 1 / 4 rounded - t - lg h - [90 %] relative group ${newMemberStats.indices.growth > 60 ? 'bg-blue-600' : 'bg-amber-400'} `}>
                        <span className="absolute -top-4 text-[9px] font-bold text-blue-700 w-full text-center">12m</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Basado en hábitos actuales ({newMemberStats.indices.growth > 60 ? 'ALTO POTENCIAL' : 'RIESGO ESTANCAMIENTO'})
                    </p>
                  </Card>
                </div>
              </div>

              {/* MIDDLE ROW: PERFILES & WINDOWS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 3. Perfiles Estratégicos */}
                <Card className="lg:col-span-2 border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <Users size={16} /> Distribución de Perfiles & Compromiso
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center hover:scale-105 transition-transform">
                      <div className="text-3xl font-black text-indigo-600 mb-1">{newMemberStats.profiles.A}%</div>
                      <div className="text-[10px] uppercase font-bold text-indigo-400">A. Sediento Espiritual</div>
                      <div className="mt-2 text-[9px] text-indigo-300 leading-tight">Listo p/ Espíritu Santo</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:scale-105 transition-transform">
                      <div className="text-3xl font-black text-slate-600 mb-1">{newMemberStats.profiles.B}%</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">B. Explorador Cauto</div>
                      <div className="mt-2 text-[9px] text-slate-300 leading-tight">Necesita Tiempo</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center hover:scale-105 transition-transform">
                      <div className="text-3xl font-black text-amber-600 mb-1">{newMemberStats.profiles.C}%</div>
                      <div className="text-[10px] uppercase font-bold text-amber-400">C. Buscador Crisis</div>
                      <div className="mt-2 text-[9px] text-amber-300 leading-tight">Atención Pastoral</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-center hover:scale-105 transition-transform">
                      <div className="text-3xl font-black text-pink-600 mb-1">{newMemberStats.profiles.D}%</div>
                      <div className="text-[10px] uppercase font-bold text-pink-400">D. Relacional</div>
                      <div className="mt-2 text-[9px] text-pink-300 leading-tight">Conversión Personal</div>
                    </div>
                  </div>

                  {/* DETAILED COMMITMENT ANALYSIS ROW */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                      <Target size={14} className="text-blue-500" /> Análisis de Compromiso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Integración Social</p>
                          <p className="text-xs font-bold text-slate-700">Conectados con Grupos/Amigos</p>
                        </div>
                        <Badge variant={newMemberStats.indices.integration > 60 ? 'success' : 'warning'}>
                          {newMemberStats.indices.integration > 60 ? 'ALTA' : 'MEDIA/BAJA'}
                        </Badge>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Proyección Servicio</p>
                          <p className="text-xs font-bold text-slate-700">Disposición a Servir</p>
                        </div>
                        <Badge variant={newMemberStats.windows.service > 40 ? 'success' : 'neutral'}>
                          {newMemberStats.windows.service > 40 ? 'DISPONIBLE' : 'EN PREPARACIÓN'}
                        </Badge>
                      </div>
                    </div>
                    {/* Linear Analysis Line */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <span>Nivel de Compromiso General</span>
                        <span>{newMemberStats.indices.commitment}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h - full rounded - full transition - all duration - 1000 ${newMemberStats.indices.commitment > 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-amber-300 to-amber-500'} `} style={{ width: `${newMemberStats.indices.commitment}% ` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic text-right">
                        {newMemberStats.indices.commitment > 80 ? 'Este grupo muestra un compromiso excepcional.' : newMemberStats.indices.commitment > 50 ? 'Compromiso estable en crecimiento.' : 'Se requiere plan de fidelización urgente.'}
                      </p>
                    </div>
                  </div>
                </Card>



                {/* 4. Windows of Opportunity */}
                <Card className="bg-slate-900 text-white border-none">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Ventanas de Oportunidad</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span className="text-blue-400">Listos p/ Discipulado</span>
                        <span>{newMemberStats.windows.discipleship}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${newMemberStats.windows.discipleship}% ` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span className="text-emerald-400">Listos p/ Servir</span>
                        <span>{newMemberStats.windows.service}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${newMemberStats.windows.service}% ` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span className="text-amber-400">Necesitan Tiempo</span>
                        <span>{newMemberStats.windows.wait}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${newMemberStats.windows.wait}% ` }}></div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 5. ACTIVE TRACKING PROCESSES (New Requested Section) */}
                <Card className="lg:col-span-3 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Procesos Activos de Seguimiento</h3>
                      <p className="text-xs text-slate-400 font-medium">Monitoreo de discípulos en etapa de evaluación y desarrollo.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                          <th className="py-3 pl-2">Miembro en Seguimiento</th>
                          <th className="py-3">Mentor Asignado</th>
                          <th className="py-3">Próxima Evaluación</th>
                          <th className="py-3 text-right pr-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {safePeople
                          .filter(p => p.status === 'Seguimiento')
                          .map(person => {
                            const nextDate = person.evaluations?.[0]?.nextAction;
                            return (
                              <tr key={person.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group">
                                <td className="py-3 pl-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${person.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                      {person.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-700">{person.name}</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  {person.assignedMentorName ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                      <UserCheck size={12} /> {person.assignedMentorName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">Sin asignar</span>
                                  )}
                                </td>
                                <td className="py-3">
                                  {nextDate ? (
                                    <div className="flex items-col flex-col">
                                      <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                                        <CalendarIcon size={12} className="text-slate-400" />
                                        {new Date(nextDate).toLocaleDateString()}
                                      </span>
                                      {(() => {
                                        const days = Math.ceil((new Date(nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        if (days < 0) return <span className="text-[9px] font-black text-rose-500 uppercase tracking-wide">Vencido hace {Math.abs(days)} días</span>;
                                        if (days === 0) return <span className="text-[9px] font-black text-amber-500 uppercase tracking-wide">¡Es Hoy!</span>;
                                        return <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Faltan {days} días</span>;
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">--</span>
                                  )}
                                </td>
                                <td className="py-3 text-right pr-2">
                                  <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {/* View Profile Button */}
                                    {/* View Profile Button */}
                                    <button
                                      onClick={() => onNavigateToMember && onNavigateToMember(person.id, 'profile')}
                                      className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg shadow-sm hover:shadow transition-all"
                                      title="Ver Ficha Completa"
                                    >
                                      <User size={16} />
                                    </button>

                                    {/* Print/Report Shortcut - Technically just opens profile currently, as discussed */}
                                    {/* Print/Report Shortcut */}
                                    <button
                                      onClick={() => onNavigateToMember && onNavigateToMember(person.id, 'report')}
                                      className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg shadow-sm hover:shadow transition-all"
                                      title="Ver Informe / Calendario"
                                    >
                                      <FileText size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {safePeople.filter(p => p.status === 'Seguimiento').length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">
                              No hay procesos de seguimiento activos actualmente.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div >

              {/* BOTTOM ROW: BARRIERS ALERT */}
              {
                (newMemberStats.barriers.cantPray > 30 || newMemberStats.barriers.needSupport > 30 || newMemberStats.barriers.uncomfortable > 20) && (
                  <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                      <AlertOctagon size={32} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-rose-800 uppercase tracking-tight text-lg">Alertas de Barreras Detectadas</h4>
                      <p className="text-rose-600/80 text-sm font-medium mb-3">Se han detectado porcentajes significativos en las siguientes áreas de dificultad:</p>
                      <div className="flex flex-wrap gap-2">
                        {newMemberStats.barriers.cantPray > 30 && <Badge variant="error">No sabe orar ({newMemberStats.barriers.cantPray}%)</Badge>}
                        {newMemberStats.barriers.needSupport > 30 && <Badge variant="error">Necesita Apoyo ({newMemberStats.barriers.needSupport}%)</Badge>}
                        {newMemberStats.barriers.uncomfortable > 20 && <Badge variant="warning">No se siente cómodo ({newMemberStats.barriers.uncomfortable}%)</Badge>}
                        {newMemberStats.barriers.work > 40 && <Badge variant="neutral">Trabajo/Estudio ({newMemberStats.barriers.work}%)</Badge>}
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-colors text-xs uppercase tracking-widest shrink-0">
                      Ver Plan de Acción
                    </button>
                  </div>
                )
              }
            </>
          )}
        </div >
      )}

      {/* Participants Modal */}
      <Modal
        isOpen={!!selectedSurveyForParticipants}
        onClose={() => setSelectedSurveyForParticipants(null)}
        title="Participantes de Encuesta"
      >
        <div className="space-y-4">
          {selectedSurveyForParticipants && (
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {getParticipantsForSurvey(selectedSurveyForParticipants).length > 0 ? (
                getParticipantsForSurvey(selectedSurveyForParticipants).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{p.local || 'Iglesia Matriz'}</p>
                    </div>
                    <div className="ml-auto">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 italic">Nadie ha respondido a esta encuesta aún.</p>
              )}
            </div>
          )}
          <button onClick={() => setSelectedSurveyForParticipants(null)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
            Cerrar Lista
          </button>
        </div>
      </Modal>

      {/* REGISTRATION INBOX MODAL */}
      <Modal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        title="Bandeja de Solicitudes de Ingreso"
        size="lg"
      >
        <div className="space-y-6">
          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase">
              <CloudIcon size={14} /> Sincronización Automática
            </div>
            <button
              onClick={async () => {
                // Refresh Logic
                setPendingRequests([]);
                try {
                  const { firebaseAdapter } = await import('../../firebaseAdapter');
                  if (firebaseAdapter?.isEnabled()) {
                    const cloudReqs = await firebaseAdapter.loadRequests();
                    setPendingRequests(prev => [...prev, ...cloudReqs]);
                  }
                } catch (e) { console.error(e); }
              }}
              className="text-xs text-indigo-500 underline hover:text-indigo-700"
            >
              Actualizar ahora
            </button>
          </div>

          {/* Upload Area (Manual Fallback) */}
          <div
            className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragActive(false);
              const files = Array.from(e.dataTransfer.files);
              for (const file of files) {
                if (file.name.endsWith('.json')) {
                  const text = await file.text();
                  try {
                    const json = JSON.parse(text);
                    if (json.type === 'registration_request') {
                      setPendingRequests(prev => [...prev, json]);
                    }
                  } catch (err) { console.error(err); }
                }
              }
            }}
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <p className="font-bold text-slate-700 text-sm uppercase">Arrastra aquí los archivos de registro</p>
            <p className="text-xs text-slate-400 mt-2">Soporta archivos .json generados por el formulario público</p>
            <input type="file" multiple accept=".json" className="hidden" id="file-upload-req" onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              for (const file of files) {
                const text = await file.text();
                try {
                  const json = JSON.parse(text);
                  if (json.type === 'registration_request') setPendingRequests(prev => [...prev, json]);
                } catch (err) { console.error(err); }
              }
            }} />
            <label htmlFor="file-upload-req" className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-600 cursor-pointer hover:bg-slate-50">
              O busca en tu equipo
            </label>
          </div>

          {/* Pending List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Solicitudes Pendientes ({pendingRequests.length})</h4>
            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-slate-300 text-sm italic">
                No hay solicitudes pendientes.
              </div>
            )}
            {pendingRequests.map((req, idx) => (
              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {(req.data.name || '?')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{req.data.name}</h4>
                    <div className="flex gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                      <span>{req.data.local}</span>
                      <span>•</span>
                      <span>{new Date(req.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={async () => {
                      if (confirm('¿Descartar esta solicitud?')) {
                        setPendingRequests(prev => prev.filter((_, i) => i !== idx));
                        // Cloud delete if exists
                        try {
                          const { firebaseAdapter } = await import('../../firebaseAdapter');
                          if (firebaseAdapter?.isEnabled()) {
                            await firebaseAdapter.deleteRequest(req.id);
                          }
                        } catch (e) { }
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      // STRICT DUPLICATE CHECK (First Name + 2 Last Names)
                      const normalizeName = (n: string) => {
                        const parts = n.trim().toLowerCase().split(/\s+/);
                        if (parts.length < 3) return n.trim().toLowerCase();
                        return `${parts[0]} ${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
                      };

                      const reqKey = normalizeName(req.data.name);

                      const potentialDupe = people.find(p => {
                        const pKey = normalizeName(p.name);
                        return pKey === reqKey;
                      });

                      if (potentialDupe) {
                        const override = confirm(`⛔ DETENIDO POR SEGURIDAD\n\nEl sistema detectó un duplicado exacto (Nombre + 2 Apellidos).\n\nRegistro Existente: ${potentialDupe.name}\nSolicitud: ${req.data.name}\n\n¿Desea FORZAR la creación de todos modos?`);
                        if (!override) return;
                      }

                      // Loose Check
                      const isLooseDuplicate = !potentialDupe && people.some(p => p.name.toLowerCase().includes(req.data.name.toLowerCase()));
                      if (isLooseDuplicate) {
                        if (!confirm(`⚠️ ALERTA: Nombre similar detectado.\n\n"${req.data.name}" se parece a alguien ya registrado.\n\n¿Es seguro continuar?`)) {
                          return;
                        }
                      }

                      // ACCEPT LOGIC
                      if (onNavigateToMember) {
                        const event = new CustomEvent('add-person-request', { detail: req.data });
                        window.dispatchEvent(event);

                        setPendingRequests(prev => prev.filter((_, i) => i !== idx));
                        try {
                          const { firebaseAdapter } = await import('../../firebaseAdapter');
                          if (firebaseAdapter?.isEnabled()) await firebaseAdapter.deleteRequest(req.id);
                        } catch (e) { }

                        alert("✅ Solicitud Aceptada: Miembro creado exitosamente.");
                        setIsInboxOpen(false);
                      }
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Revisar y Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div >
  );
};

export default Dashboard;
