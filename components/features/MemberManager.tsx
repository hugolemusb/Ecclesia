import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Edit2, Trash2, UserPlus, X, Save,
  Check, ClipboardList, Eye, Clock, UserCheck2, ShieldAlert, UserMinus,
  Mail, Phone, MapPin, Briefcase, Calendar, Heart, Users, Filter, XCircle, TrendingUp, Target,
  UserCheck, CheckCircle2, FileText, Plus, User
} from 'lucide-react';
import { OFFICIAL_MINISTRIES } from '../../constants';
import { Person, UserRole, ChurchLocal, ChurchPosition, MemberStatus, SurveyTemplate, Gender, SurveyResponse, AppConfig, CalendarEvent } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import SurveyTaker from './SurveyTaker';
import EvaluationHistory from './EvaluationHistory';
import MemberAnalysisEditor from './MemberAnalysisEditor';
import MemberReportView from './MemberReportView';
import { Family } from '../../types'; // Import Family type

interface MemberManagerProps {
  role: UserRole;
  people: Person[];
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  onDelete: (id: number) => void;
  templates: SurveyTemplate[];
  setResponses: React.Dispatch<React.SetStateAction<SurveyResponse[]>>;
  responses: SurveyResponse[]; // Added for history
  appConfig: AppConfig;
  families: Family[];
  setFamilies: (families: Family[]) => void;
  events?: CalendarEvent[];
  setEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  initialMemberId?: number | null; // Deep linking prop
  initialMode?: 'profile' | 'report';
  onClearInitialMember?: () => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({ role, people, setPeople, onDelete, templates, setResponses, responses, appConfig, families, setFamilies, events, setEvents, initialMemberId, initialMode, onClearInitialMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [viewMentorshipSummary, setViewMentorshipSummary] = useState<Person | null>(null);

  // Mentorship Form State
  const [mentorshipType, setMentorshipType] = useState<'Member' | 'Ministry' | 'Body'>('Member');
  const [mentorshipTargetId, setMentorshipTargetId] = useState<string>('');
  const [isAnalysisEditorOpen, setIsAnalysisEditorOpen] = useState(false); // New State for Editor
  const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState<'identidad' | 'contacto' | 'eclesiastica' | 'ministerios' | 'historial' | 'ecrecimiento' | 'analisis' | 'seguimiento' | 'observaciones'>('identidad');
  const [viewMode, setViewMode] = useState<'general' | 'new_members'>('general'); // Tab state

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: 'all', // all, child, youth, adult, senior
    sacraments: {
      baptism: false,
      presentation: false
    },
    maritalStatus: 'all',
    ministry: 'all',
    hasChildren: false,
    pendingEval: false // New filter
  });

  // DEEP LINKING EFFECT
  useEffect(() => {
    if (initialMemberId) {
      const person = people.find(p => p.id === initialMemberId);
      if (person) {
        setEditingPerson(person);
        if (initialMode === 'report') {
          setIsReportOpen(true);
        } else {
          setIsModalOpen(true);
          // Optional: Jump to specific tab if needed, but default is fine
        }
      }
      // Clear the ID so it doesn't reopen if we close and re-render
      if (onClearInitialMember) onClearInitialMember();
    }
  }, [initialMemberId, initialMode, people, onClearInitialMember]);

  const memberStatuses: { value: MemberStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'Activo', label: 'En Plena Comunión', icon: <UserCheck2 size={16} />, color: 'text-green-600' },
    { value: 'Seguimiento', label: 'En Seguimiento', icon: <Clock size={16} />, color: 'text-amber-600' },
    { value: 'Detenido', label: 'Detenido / Disciplina', icon: <ShieldAlert size={16} />, color: 'text-rose-600' },
    { value: 'Inactivo', label: 'Inactivo / Retirado', icon: <UserMinus size={16} />, color: 'text-slate-600' },
  ];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const getAgeGroup = (age: number) => {
    if (age <= 12) return 'child';
    if (age <= 30) return 'youth';
    if (age <= 59) return 'adult';
    return 'senior';
  };

  const calculateMembershipDuration = (fromDate: string) => {
    if (!fromDate) return 'SIN DATOS';
    const start = new Date(fromDate);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
      years--;
      months += 12;
    }

    if (now.getDate() < start.getDate()) {
      months--;
    }

    if (years < 0) return 'FECHA FUTURA';

    let result = '';
    if (years > 0) result += `${years} AÑO${years !== 1 ? 'S' : ''}`;
    if (months > 0) result += `${result ? ' Y ' : ''}${months} MES${months !== 1 ? 'ES' : ''}`;
    if (!result && years === 0) result = 'MENOS DE 1 MES';

    return result;
  };

  const filteredPeople = useMemo(() => {
    return people
      .filter(p => {
        // 1. Text Search
        const matchesSearch = p.name.toUpperCase().includes(searchTerm.toUpperCase());
        if (!matchesSearch) return false;

        // 2. Advanced Filters
        // Age
        if (filters.ageGroup !== 'all') {
          const age = calculateAge(p.birthDate);
          const group = getAgeGroup(age);
          if (group !== filters.ageGroup) return false;
        }

        // Sacraments
        if (filters.sacraments.baptism && !p.baptized) return false;
        if (filters.sacraments.presentation && !p.presentation) return false;

        // Children
        if (filters.hasChildren && !p.children) return false;

        // Marital
        if (filters.maritalStatus !== 'all' && p.maritalStatus.toUpperCase() !== filters.maritalStatus.toUpperCase()) return false;

        // Ministry
        if (filters.ministry !== 'all' && (!p.ministries || !p.ministries.includes(filters.ministry))) return false;

        // Pending Evaluation Filter
        if (filters.pendingEval) {
          // Check if Mentor with pending disciples
          const isMentor = ['PASTOR', 'LIDER', 'LÍDER', 'GUIA', 'GUÍA'].some(role =>
            (p.churchPositions || []).some(pos => pos.toUpperCase().includes(role))
          );
          let hasPendingDisciples = false;
          if (isMentor) {
            const disciples = people.filter(d => d.assignedMentorId === p.id);
            hasPendingDisciples = disciples.some(d => {
              const nextDate = d.evaluations?.[0]?.nextAction;
              return nextDate && new Date(nextDate) <= new Date();
            });
          }

          // Check if Member has pending self-evaluation
          const nextSelfEval = p.evaluations?.[0]?.nextAction;
          const isSelfPending = nextSelfEval && new Date(nextSelfEval) <= new Date();

          if (!hasPendingDisciples && !isSelfPending) return false;
        }

        return true;
      })
      .filter(p => {
        if (viewMode === 'new_members') {
          // Define "New Member" logic: Status 'Seguimiento' OR joined in last 3 months
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          const isNew = new Date(p.conversionDate) > threeMonthsAgo || new Date(p.memberSince) > threeMonthsAgo;
          return p.status === 'Seguimiento' || isNew;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, searchTerm, filters, viewMode]);

  // Predictive Text Lists
  const uniqueComunas = useMemo(() => Array.from(new Set(people.map(p => p.comuna).filter(Boolean).sort())), [people]);
  const uniqueCities = useMemo(() => Array.from(new Set(people.map(p => p.ciudad).filter(Boolean).sort())), [people]);
  const uniqueJobs = useMemo(() => Array.from(new Set(people.map(p => p.occupation).filter(Boolean).sort())), [people]);

  const handleOpenModal = (person?: Person) => {
    try {
      console.log("Opening modal for:", person);
      setActiveTab('identidad');
      if (person) {
        setEditingPerson({ ...person });
      } else {
        setEditingPerson({
          id: Date.now(),
          name: '',
          age: 0,
          birthDate: '',
          gender: 'M',
          address: '',
          comuna: '',
          ciudad: '',
          local: 'Iglesia Matriz',
          churchPositions: ['Hermano'],
          email: '',
          phone: '',
          maritalStatus: 'Soltero',
          roleInFamily: 'Hijo',
          occupation: '',
          memberSince: new Date().toISOString().split('T')[0],
          conversionDate: new Date().toISOString().split('T')[0],
          ministries: [],
          commitmentScore: 50,
          baptized: false,
          presentation: false,
          children: false,
          active: true,
          status: 'Activo',
          zone: 'CENTRAL'
        });
      }
      setIsModalOpen(true);
    } catch (e) {
      console.error("Error opening modal:", e);
      alert("Error al abrir ficha:Verifica la consola para más detalles.");
    }
  };

  const handleSave = () => {
    try {
      if (!editingPerson?.name || !editingPerson?.birthDate || !editingPerson?.address) {
        alert('CAMPOS OBLIGATORIOS: NOMBRE, FECHA DE NACIMIENTO Y DIRECCIÓN.');
        return;
      }

      const personToSave = {
        ...editingPerson,
        age: calculateAge(editingPerson.birthDate as string),
        name: editingPerson.name.toUpperCase(),
        address: editingPerson.address.toUpperCase(),
        comuna: (editingPerson.comuna || '').toUpperCase(),
        ciudad: (editingPerson.ciudad || '').toUpperCase(),
        occupation: (editingPerson.occupation || '').toUpperCase(),
        email: (editingPerson.email || '').toUpperCase(),
        roleInFamily: (editingPerson.roleInFamily || '').toUpperCase(),
      } as Person;

      setPeople(prev => {
        const exists = prev.find(p => p.id === personToSave.id);
        return exists ? prev.map(p => p.id === personToSave.id ? personToSave : p) : [...prev, personToSave];
      });

      // --- SYNC LOGIC (Moved here for reliability) ---
      // If person has children list, update their family notes automatically
      if (personToSave.childrenList && personToSave.childrenList.length > 0 && families && setFamilies) {
        const personFamily = families.find(f => f.members.some(m => m.personId === personToSave.id));
        if (personFamily) {
          const childrenText = personToSave.childrenList.map(c =>
            `- ${c.name} (${c.age || '?'}) [${c.congregates ? 'CONGREGA' : 'NO CONGREGA'}]`
          ).join('\n');

          const noteHeader = `* Hijos de ${personToSave.name}:`;
          const fullNoteBlock = `${noteHeader}\n${childrenText}`;

          let newNotes = personFamily.notes || '';

          // Simple append/replace strategy
          if (newNotes.includes(noteHeader)) {
            // Try to split and replace logic or just append if complex. 
            // For now, let's just append a fresh block at the end if it exists, 
            // or maybe we should be smarter. 
            // User wants "order", so let's just append with a timestamp line or clear separator?
            // Let's go with a clear separator approach.
            const parts = newNotes.split(noteHeader);
            // Keep the part before the header, discard the part after (assuming it was the list) until next double newline
            // This is risky without strict formatting.
            // SAFER: Just append to the end.
            newNotes = newNotes + `\n\n[ACTUALIZACIÓN ${new Date().toLocaleDateString()}]\n` + fullNoteBlock;
          } else {
            newNotes = newNotes ? `${newNotes}\n\n${fullNoteBlock}` : fullNoteBlock;
          }

          const updatedFamily = { ...personFamily, notes: newNotes };
          setFamilies(families.map(f => f.id === updatedFamily.id ? updatedFamily : f));
        }
      }

      setIsModalOpen(false);
      setEditingPerson(null);
    } catch (e) {
      console.error("Error saving person:", e);
      alert("Error al guardar: " + e);
    }
  };

  const resetFilters = () => {
    setFilters({
      ageGroup: 'all',
      sacraments: { baptism: false, presentation: false },
      maritalStatus: 'all',
      ministry: 'all',
      hasChildren: false
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 pb-20">
      <div className="flex flex-col gap-4">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md flex gap-2">
            <Input
              icon={<Search size={18} />}
              placeholder="BUSCAR HERMANO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="uppercase font-bold"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
              title="Filtros Avanzados"
            >
              <Filter size={18} />
            </button>
          </div>
          <Button
            onClick={() => {
              handleOpenModal();
            }}
            leftIcon={<UserPlus size={18} />}
            className="uppercase text-xs tracking-widest shadow-lg"
          >
            Nuevo Integrante
          </Button>
        </div>

        {/* VIEW TABS */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('general')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <Users size={14} className="inline mr-2 mb-0.5" />
            Listado General
          </button>
          <button
            onClick={() => setViewMode('new_members')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'new_members' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <UserPlus size={14} className="inline mr-2 mb-0.5" />
            Nuevos Miembros
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-top-4 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Filter size={16} className="text-blue-500" /> Filtros Avanzados</h3>
              <button onClick={resetFilters} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 flex items-center gap-1"><XCircle size={12} /> Limpiar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Age Group */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango Etario</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500"
                  value={filters.ageGroup}
                  onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
                >
                  <option value="all">Todos</option>
                  <option value="child">Niños (0-12)</option>
                  <option value="youth">Jóvenes (12-30)</option>
                  <option value="adult">Adultos (30-59)</option>
                  <option value="senior">Adulto Mayor (60+)</option>
                </select>
              </div>

              {/* Marital Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Civil</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500"
                  value={filters.maritalStatus}
                  onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                >
                  <option value="all">Todos</option>
                  <option value="Soltero">Solteros</option>
                  <option value="Casado">Casados</option>
                  <option value="Viudo">Viudos</option>
                  <option value="Divorciado">Divorciados</option>
                </select>
              </div>

              {/* Ministry */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ministerio / Grupo</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500"
                  value={filters.ministry}
                  onChange={(e) => setFilters({ ...filters, ministry: e.target.value })}
                >
                  <option value="all">Todos</option>
                  {appConfig.ministries.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Pending Evaluation Filter */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="filterPending"
                  checked={filters.pendingEval}
                  onChange={(e) => setFilters({ ...filters, pendingEval: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="filterPending" className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">
                  Evaluaciones Pendientes
                </label>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atributos</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={filters.sacraments.baptism} onChange={e => setFilters({ ...filters, sacraments: { ...filters.sacraments, baptism: e.target.checked } })} className="rounded text-blue-600 focus:ring-blue-500" />
                    Bautizados
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={filters.sacraments.presentation} onChange={e => setFilters({ ...filters, sacraments: { ...filters.sacraments, presentation: e.target.checked } })} className="rounded text-blue-600 focus:ring-blue-500" />
                    Presentados
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={filters.hasChildren} onChange={e => setFilters({ ...filters, hasChildren: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                    Tiene Hijos (Padres)
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Results Count */}
      <div className="-mt-2 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">
        Mostrando {filteredPeople.length} de {people.length} miembros
      </div>

      <Table<Person>
        data={filteredPeople}
        keyExtractor={(item) => item.id}
        columns={[
          {
            header: 'Estado',
            accessor: (person) => {
              const statusConfig = memberStatuses.find(s => s.value === person.status) || memberStatuses[2];
              return (
                <Badge
                  variant={person.status === 'Activo' ? 'success' : person.status === 'Detenido' ? 'danger' : 'default'}
                  className="gap-1.5 pl-1.5 pr-3 py-1.5"
                >
                  <div className={`p-1 rounded-full bg-white/50`}>{statusConfig.icon}</div>
                  {statusConfig.label}
                </Badge>
              );
            }
          },
          {
            header: 'Hermano/a',
            accessor: (person) => (
              <div>
                <p className="font-black uppercase text-slate-800">{person.name}</p>
                <div className="flex gap-2 mt-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{person.local}</p>
                  {person.age > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{person.age} AÑOS</span>}
                </div>
              </div>
            )
          },
          {
            header: 'Ministerios',
            accessor: (person) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {person.ministries?.slice(0, 2).map(m => (
                  <span key={m} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold uppercase">{m}</span>
                ))}
                {(person.ministries?.length || 0) > 2 && <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold">+{person.ministries!.length - 2}</span>}
              </div>
            ),
            className: "hidden md:table-cell"
          },
          {
            header: 'Contacto',
            accessor: (person) => (
              <div className="flex flex-col gap-1">
                {person.phone && <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"><Phone size={10} /> {person.phone}</div>}
                {person.email && <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"><Mail size={10} /> {person.email.toLowerCase()}</div>}
              </div>
            )
          },
          {
            header: 'Dirección',
            accessor: (person) => (
              <div className="flex flex-col gap-1">
                {person.address && <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><MapPin size={10} /> {person.address}</div>}
                {person.comuna && <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">{person.comuna}</div>}
              </div>
            ),
            className: "hidden lg:table-cell"
          },
          {
            header: 'Mentoria',
            accessor: (person) => {
              // 1. Explicit Assignments (New System)
              const explicitCount = person.mentorshipAssignments?.filter(a => a.status === 'Active').length || 0;

              // 2. Implicit Assignments (Legacy/Simple System) - People who have THIS person as mentor
              const implicitCount = people.filter(p => p.assignedMentorId === person.id && p.active).length;

              const totalCount = explicitCount + implicitCount;

              // Show if has assignments OR has role
              if (totalCount === 0 && !['PASTOR', 'LIDER', 'LIGDER', 'GUIA'].some(r => (person.churchPositions || []).join(' ').toUpperCase().includes(r))) return <span className="text-slate-300">-</span>;

              return (
                <div onClick={(e) => { e.stopPropagation(); setViewMentorshipSummary(person); }} className="cursor-pointer group">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-center transition-all ${totalCount > 0 ? 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                    {totalCount} Asignados
                  </div>
                </div>
              );
            }
          },
          {
            header: 'Evaluación',
            accessor: (person) => {
              // Logic for Mentors
              const isMentor = ['PASTOR', 'LIDER', 'LÍDER', 'GUIA', 'GUÍA'].some(role =>
                (person.churchPositions || []).some(pos => pos.toUpperCase().includes(role))
              );

              if (isMentor) {
                const disciples = people.filter(p => p.assignedMentorId === person.id);
                const pendingDisciples = disciples.filter(d => {
                  const nextDate = d.evaluations?.[0]?.nextAction;
                  if (!nextDate) return false;
                  return new Date(nextDate) <= new Date(); // Due or Overdue
                }).length;

                if (pendingDisciples > 0) {
                  return (
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      {pendingDisciples} Pendientes
                    </span>
                  );
                }
              }

              // Logic for Regular Members (Self)
              const nextEval = person.evaluations?.[0]?.nextAction;
              if (nextEval) {
                const date = new Date(nextEval);
                const today = new Date();
                const isOverdue = date < today;
                return (
                  <div className={`flex flex-col ${isOverdue ? 'text-rose-500' : 'text-emerald-600'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{date.toLocaleDateString()}</span>
                    {isOverdue && <span className="text-[8px] font-bold">VENCIDA</span>}
                  </div>
                );
              }

              return <span className="text-[10px] text-slate-300 font-bold">-</span>;
            }
          },
          {
            header: 'Acciones',
            accessor: (person) => (
              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setTargetPerson(person); setIsSurveyModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Encuesta"><ClipboardList size={16} /></button>
                <button onClick={() => handleOpenModal(person)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(person.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            )
          }
        ]}
        onRowClick={(person) => handleOpenModal(person)}
      />

      <Modal
        isOpen={isModalOpen && !!editingPerson}
        onClose={() => setIsModalOpen(false)}
        title="Ficha de Integrante"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="uppercase text-[10px]">Cancelar</Button>
            {/* Direct Report Button if editing existing person */}
            {editingPerson?.id && editingPerson.id > 10000 && ( // Simple heuristic or just check if it's not new (Date.now() usually large, but let's just check if it exists in people array ideally)
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsReportOpen(true);
                  if (editingPerson.id) setTargetPerson(people.find(p => p.id === editingPerson.id) || null);
                }}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 uppercase text-[10px] tracking-widest border border-indigo-100"
                icon={<FileText size={18} />}
              >
                Ver Informe
              </Button>
            )}
            <Button onClick={handleSave} leftIcon={<Save size={18} />} className="uppercase text-[10px] tracking-widest">Guardar Integrante</Button>
          </>
        }
      >
        {editingPerson && (
          <>
            <div className="flex border-b bg-slate-50 overflow-x-auto custom-scrollbar -mx-8 -mt-8 mb-8">
              {[
                { id: 'identidad', label: 'Identidad', icon: <Users size={14} /> },
                { id: 'contacto', label: 'Contacto/Laboral', icon: <MapPin size={14} /> },
                { id: 'eclesiastica', label: 'Eclesiástica', icon: <Calendar size={14} /> },
                { id: 'ministerios', label: 'Ministerios', icon: <Briefcase size={14} /> },
                { id: 'analisis', label: 'Crecimiento', icon: <TrendingUp size={14} /> },
                { id: 'seguimiento', label: 'Seguimiento', icon: <ClipboardList size={14} /> },
                { id: 'mentoria', label: 'Mentoría', icon: <UserCheck size={14} /> }
              ].concat([{ id: 'observaciones', label: 'Observaciones', icon: <Eye size={14} /> }]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'} `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeTab === 'observaciones' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                    <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Eye size={18} /> Observaciones Generales
                    </h3>
                    <textarea
                      className="w-full h-48 bg-white border border-amber-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                      placeholder="Ingrese observaciones generales sobre el miembro, detalles de personalidad, trasfondo o notas que no correspondan a una sesión de seguimiento específica..."
                      value={editingPerson.observations || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, observations: e.target.value })}
                    />
                    <p className="text-[10px] text-amber-600/60 font-medium text-right mt-2">
                      Estas observaciones son privadas y visibles solo para el liderazgo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-1">
              {activeTab === 'mentoria' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-wide mb-1 flex items-center gap-2">
                          <UserCheck size={20} /> Panel de Mentoría
                        </h3>
                        <p className="text-blue-100 text-xs font-medium max-w-lg">
                          Gestione el seguimiento espiritual de los discípulos asignados a su cuidado.
                          Recuerde actualizar las notas pastorales después de cada encuentro.
                        </p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                        <span className="block text-2xl font-black">{people.filter(p => p.assignedMentorId === editingPerson.id).length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-blue-200">Discípulos</span>
                      </div>
                    </div>
                  </div>

                  {people.filter(p => p.assignedMentorId === editingPerson.id).length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <UserCheck size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400 font-bold uppercase text-xs">No tiene discípulos asignados actualmente.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {people
                        .filter(p => p.assignedMentorId === editingPerson.id)
                        .map(mentee => {
                          const lastEval = mentee.evaluations?.[0];
                          return (
                            <div key={mentee.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${mentee.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                    {mentee.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-700 text-sm">{mentee.name}</h4>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${mentee.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' :
                                      mentee.status === 'Seguimiento' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-500'
                                      }`}>
                                      {mentee.status}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    // Clean switch to view the mentee
                                    setTargetPerson(mentee); // Assuming this opens survey usually, but we want edit/view
                                    setEditingPerson(mentee); // Switch context to mentee
                                    setActiveTab('seguimiento'); // Go directly to tracking tab
                                  }}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors uppercase"
                                >
                                  Ver Ficha
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Nota</p>
                                  <p className="text-slate-600 line-clamp-2 italic">{mentee.pastoralNotes || 'Sin notas registradas.'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Calendar size={10} /> Próxima Acción
                                  </p>
                                  {lastEval?.nextAction ? (
                                    <p className="font-bold text-indigo-600">
                                      {new Date(lastEval.nextAction).toLocaleDateString()}
                                    </p>
                                  ) : (
                                    <p className="text-slate-400">No programada</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {activeTab === 'historial' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Historial de Encuestas
                  </h3>

                  {responses.filter(r => r.personId === editingPerson.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No hay encuestas registradas para este miembro.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {responses
                        .filter(r => r.personId === editingPerson.id)
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map(response => {
                          const template = templates.find(t => t.id === response.templateId);
                          return (
                            <div key={response.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                  <ClipboardList size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{template?.name || 'Encuesta Desconocida'}</p>
                                  <p className="text-xs text-slate-500 font-mono">{new Date(response.updatedAt).toLocaleDateString()} · {new Date(response.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="success">Completada</Badge>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'identidad' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nombre Completo" value={editingPerson.name || ''} onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value.toUpperCase() })} className="uppercase font-bold" />

                    <div className="grid grid-cols-2 gap-4">
                      <Input type="date" label="Fecha Nacimiento" value={editingPerson.birthDate || ''} onChange={(e) => setEditingPerson({ ...editingPerson, birthDate: e.target.value })} className="font-bold" />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Género</label>
                        <select value={editingPerson.gender} onChange={(e) => setEditingPerson({ ...editingPerson, gender: e.target.value as Gender })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="M">MASCULINO</option>
                          <option value="F">FEMENINO</option>
                          <option value="O">OTRO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Civil</label>
                      <select value={editingPerson.maritalStatus} onChange={(e) => setEditingPerson({ ...editingPerson, maritalStatus: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        <option value="Soltero">SOLTERO(A)</option>
                        <option value="Casado">CASADO(A)</option>
                        <option value="Viudo">VIUDO(A)</option>
                        <option value="Divorciado">DIVORCIADO(A)</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center h-[50px] px-2 bg-blue-50/50 rounded-xl border border-blue-100">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer w-full">
                          <input type="checkbox" checked={editingPerson.children || false} onChange={e => setEditingPerson({ ...editingPerson, children: e.target.checked })} className="rounded text-blue-600 w-5 h-5" />
                          Tiene Hijos (Marcar para habilitar detalles)
                        </label>
                      </div>

                      {editingPerson.children && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Hijos</label>
                              <button
                                onClick={() => {
                                  const newList = [...(editingPerson.childrenList || [])];
                                  newList.push({ id: Date.now().toString(), name: '', congregates: false });
                                  setEditingPerson({
                                    ...editingPerson,
                                    childrenList: newList,
                                    numberOfChildren: newList.length
                                  });
                                }}
                                className="text-[10px] font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors uppercase flex items-center gap-1"
                              >
                                <Users size={12} /> Agregar Hijo
                              </button>
                            </div>

                            <div className="space-y-2">
                              {editingPerson.childrenList?.map((child, index) => (
                                <div key={child.id} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                    {index + 1}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="NOMBRE"
                                    value={child.name}
                                    onChange={(e) => {
                                      const newList = [...(editingPerson.childrenList || [])];
                                      newList[index].name = e.target.value.toUpperCase();
                                      setEditingPerson({ ...editingPerson, childrenList: newList });
                                    }}
                                    className="flex-1 bg-transparent text-sm font-bold text-slate-700 focus:outline-none uppercase placeholder:text-slate-300"
                                  />
                                  <input
                                    type="number"
                                    placeholder="EDAD"
                                    value={child.age || ''}
                                    onChange={(e) => {
                                      const newList = [...(editingPerson.childrenList || [])];
                                      newList[index].age = parseInt(e.target.value) || undefined;
                                      setEditingPerson({ ...editingPerson, childrenList: newList });
                                    }}
                                    className="w-16 bg-slate-50 rounded-lg px-2 py-1 text-sm font-bold text-center focus:outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const newList = [...(editingPerson.childrenList || [])];
                                      newList[index].congregates = !newList[index].congregates;
                                      setEditingPerson({ ...editingPerson, childrenList: newList });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${child.congregates ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    title="¿Se congrega?"
                                  >
                                    {child.congregates ? 'Congrega' : 'No Congrega'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newList = (editingPerson.childrenList || []).filter(c => c.id !== child.id);
                                      setEditingPerson({
                                        ...editingPerson,
                                        childrenList: newList,
                                        numberOfChildren: newList.length
                                      });
                                    }}
                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              ))}
                              {(!editingPerson.childrenList || editingPerson.childrenList.length === 0) && (
                                <p className="text-center text-slate-400 text-xs py-4 italic">No hay hijos registrados</p>
                              )}
                            </div>
                            <div className="mt-2 text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Total: {editingPerson.numberOfChildren || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Input label="Rol en la Familia (Texto)" value={editingPerson.roleInFamily || ''} onChange={(e) => setEditingPerson({ ...editingPerson, roleInFamily: e.target.value.toUpperCase() })} placeholder="EJ: PADRE, HIJO..." className="uppercase font-bold" />
                </div>
              )}

              {activeTab === 'contacto' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input type="tel" label="Teléfono Móvil" value={editingPerson.phone || ''} onChange={(e) => setEditingPerson({ ...editingPerson, phone: e.target.value })} placeholder="+569..." className="font-bold" />
                    <Input type="email" label="Correo Electrónico" value={editingPerson.email || ''} onChange={(e) => setEditingPerson({ ...editingPerson, email: e.target.value.toUpperCase() })} className="uppercase font-bold" />
                  </div>
                  <Input label="Dirección (Calle, N°, Dpto)" value={editingPerson.address || ''} onChange={(e) => setEditingPerson({ ...editingPerson, address: e.target.value.toUpperCase() })} className="uppercase font-bold" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Comuna" value={editingPerson.comuna || ''} onChange={(e) => setEditingPerson({ ...editingPerson, comuna: e.target.value.toUpperCase() })} className="uppercase font-bold" list="comunas-list" />
                    <Input label="Ciudad" value={editingPerson.ciudad || ''} onChange={(e) => setEditingPerson({ ...editingPerson, ciudad: e.target.value.toUpperCase() })} className="uppercase font-bold" list="ciudades-list" />
                    <Input label="Ocupación / Oficio" value={editingPerson.occupation || ''} onChange={(e) => setEditingPerson({ ...editingPerson, occupation: e.target.value.toUpperCase() })} className="uppercase font-bold" list="jobs-list" />
                  </div>
                </div>
              )}

              {activeTab === 'eclesiastica' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Locales Asignados (Selección Múltiple)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(appConfig.churchLocals || []).map(l => (
                          <button key={l} onClick={() => {
                            const curr = editingPerson.locals || (editingPerson.local ? [editingPerson.local] : []);
                            // Toggle logic
                            const newList = curr.includes(l) ? curr.filter(x => x !== l) : [...curr, l];
                            setEditingPerson({
                              ...editingPerson,
                              locals: newList,
                              local: newList.length > 0 ? (newList[0] as ChurchLocal) : ('Ninguno' as ChurchLocal)
                            });
                          }}
                            className={`flex items-center justify-between px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editingPerson.locals?.includes(l) || (!editingPerson.locals && editingPerson.local === l) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                            {l.toUpperCase()}
                            {(editingPerson.locals?.includes(l) || (!editingPerson.locals && editingPerson.local === l)) && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="date" label="Fecha Conversión" value={editingPerson.conversionDate || ''} onChange={(e) => setEditingPerson({ ...editingPerson, conversionDate: e.target.value })} className="font-bold" />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                          Membresía Desde
                          <span className="text-blue-600 bg-blue-50 px-2 rounded-md font-bold">{calculateMembershipDuration(editingPerson.memberSince || '')}</span>
                        </label>
                        <Input type="date" value={editingPerson.memberSince || ''} onChange={(e) => setEditingPerson({ ...editingPerson, memberSince: e.target.value })} className="font-bold" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Comunión</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {memberStatuses.map((status) => (
                        <button key={status.value} onClick={() => setEditingPerson({ ...editingPerson, status: status.value })}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${editingPerson.status === status.value ? `border-blue-600 bg-blue-50 shadow-sm` : 'bg-white border-slate-100 hover:border-blue-200'}`}
                        >
                          <div className={`p-2 rounded-lg bg-white shadow-sm ${status.color}`}>{status.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest">{status.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={editingPerson.baptized} onChange={(e) => setEditingPerson({ ...editingPerson, baptized: e.target.checked })} className="w-5 h-5 accent-blue-600" id="check-baptized" />
                      <label htmlFor="check-baptized" className="text-xs font-bold text-slate-700 uppercase">¿Bautizado en Aguas?</label>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <input type="checkbox" checked={editingPerson.presentation} onChange={(e) => setEditingPerson({ ...editingPerson, presentation: e.target.checked })} className="w-5 h-5 accent-blue-600" id="check-presentation" />
                      <label htmlFor="check-presentation" className="text-xs font-bold text-slate-700 uppercase">¿Presentado?</label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ministerios' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jerarquía Eclesiástica</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(appConfig.churchPositions || []).map(pos => (
                        <button key={pos} onClick={() => {
                          const curr = editingPerson.churchPositions || [];
                          setEditingPerson({ ...editingPerson, churchPositions: curr.includes(pos) ? (curr.length > 1 ? curr.filter(x => x !== pos) : curr) : [...curr, pos] });
                        }}
                          className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${editingPerson.churchPositions?.includes(pos) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ministerios y Cuerpos</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(appConfig.ministries || []).map(min => (
                        <button key={min} onClick={() => {
                          const curr = editingPerson.ministries || [];
                          setEditingPerson({ ...editingPerson, ministries: curr.includes(min) ? curr.filter(x => x !== min) : [...curr, min] });
                        }}
                          className={`flex items-center justify-between px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editingPerson.ministries?.includes(min) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                          {min}
                          {editingPerson.ministries?.includes(min) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analisis' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  {/* Logic for Deep Member Analytics */}
                  {(() => {
                    const initialSurvey = responses.find(r => r.personId === editingPerson.id && r.templateId === 201);
                    const followUpSurvey = responses.find(r => r.personId === editingPerson.id && r.templateId === 202);

                    if (!initialSurvey) {
                      return (
                        <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                          <ClipboardList size={40} className="mx-auto text-slate-300 mb-4" />
                          <p className="text-sm font-bold text-slate-500 uppercase">Sin Análisis Inicial</p>
                          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Este miembro aún no ha completado la encuesta "Nuevos Miembros (Inicial)".</p>
                          <button onClick={() => { setTargetPerson(editingPerson as Person); setIsSurveyModalOpen(true); }} className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase hover:bg-blue-200 transition-colors">
                            Iniciar Encuesta Ahora
                          </button>
                        </div>
                      );
                    }



                    // --- CALCULATION LOGIC (Matched with Dashboard) ---
                    const getAns = (r: SurveyResponse, id: number) => String(r.answers.find(a => a.questionId === id)?.value || '');
                    const hasOpt = (r: SurveyResponse, id: number, text: string) => getAns(r, id).toUpperCase().includes(text);
                    const r = initialSurvey;

                    // 1. Foundation Index
                    let p2 = 0; // Experience
                    if (hasOpt(r, 20104, 'ASISTÍ')) p2 = 75; else if (hasOpt(r, 20104, 'LEÍA')) p2 = 50; else if (hasOpt(r, 20104, 'ALGO')) p2 = 25;
                    let p5 = getAns(r, 20107) === 'VERDADERO' ? 100 : (getAns(r, 20107) === 'NO LO SÉ' ? 50 : 0);
                    let p17 = 0; // Devotional
                    const a17 = getAns(r, 20119).toUpperCase();
                    if (a17.includes('CASI TODOS')) p17 = 100; else if (a17.includes('ALGUNAS')) p17 = 75; else if (a17.includes('OCASIONALMENTE')) p17 = 50; else if (a17.includes('SOLO')) p17 = 25;
                    let p19 = 0; // Understanding
                    if (hasOpt(r, 20121, 'MAYORÍA')) p19 = 100; else if (hasOpt(r, 20121, 'ALGUNAS')) p19 = 75; else if (hasOpt(r, 20121, 'CUESTA')) p19 = 25;

                    const foundationScore = Math.round((p2 + p5 + p17 + p19) / 4);

                    // 2. Profile Identification
                    const p6_changes = !hasOpt(r, 20108, 'AÚN NO');
                    const p9_baptism = hasOpt(r, 20111, 'YA ESTOY') || hasOpt(r, 20111, 'GUSTARÍA');
                    const isCrisis = hasOpt(r, 20122, 'NECESIDAD') || hasOpt(r, 20117, 'APOYO ESPIRITUAL');
                    const isRelational = hasOpt(r, 20103, 'AMIGO') || hasOpt(r, 20122, 'INFLUENCIA');

                    let profileType = 'B';
                    if (p5 === 100 && p6_changes && p17 >= 75 && p9_baptism) profileType = 'A'; // Sediento
                    else if (isCrisis) profileType = 'C'; // Crisis
                    else if (isRelational && foundationScore < 50) profileType = 'D'; // Relacional (Acompañante)

                    const profileData = {
                      A: { title: 'Sediento Espiritual', color: 'indigo', desc: 'Listo para discipulado intensivo y compromiso.' },
                      B: { title: 'Explorador Cauto', color: 'blue', desc: 'Requiere tiempo, respuestas claras y no presión.' },
                      C: { title: 'Buscador en Crisis', color: 'rose', desc: 'Necesita contención pastoral antes de doctrina.' },
                      D: { title: 'Acompañante Relacional', color: 'amber', desc: 'Conectado por vínculo humano, necesita encuentro personal.' }
                    }[profileType] || { title: 'Evaluando', color: 'slate', desc: 'Perfil en definición' };

                    // 3. Current Level (Approximation)
                    let currentLevel = 1;
                    if (foundationScore > 50 && p6_changes) currentLevel = 2;
                    if (currentLevel === 2 && p9_baptism) currentLevel = 3;
                    if (currentLevel === 3 && p17 >= 75 && getAns(r, 20114) === 'VERDADERO') currentLevel = 4;

                    const levels = ['Fundamentos', 'Discipulado', 'Bautismo', 'Espíritu Santo'];

                    return (
                      <div className="space-y-6">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => setIsAnalysisEditorOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all hover:scale-105"
                          >
                            <FileText size={16} /> Configurar Informe (Seguimiento)
                          </button>
                        </div>
                        {/* 1. PROFILE HEADER */}
                        <div className={`p-4 rounded-xl border border-${profileData.color}-200 bg-${profileData.color}-50 flex justify-between items-start`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="neutral" className={`bg-${profileData.color}-200 text-${profileData.color}-800 border-${profileData.color}-300`}>PERFIL {profileType}</Badge>
                              <h3 className={`font-black text-${profileData.color}-900 text-lg uppercase tracking-tight`}>{profileData.title}</h3>
                            </div>
                            <p className={`text-xs font-bold text-${profileData.color}-700/80 max-w-sm`}>{profileData.desc}</p>
                          </div>
                          <div className={`p-3 bg-white rounded-xl shadow-sm border border-${profileData.color}-100`}>
                            <UserCheck size={24} className={`text-${profileData.color}-500`} />
                          </div>
                        </div>

                        {/* 2. PROGRESS TRACKER */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ruta de Progreso Espiritual</h4>
                          <div className="relative flex justify-between px-2">
                            {/* Connector Line */}
                            <div className="absolute top-3 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
                            {levels.map((lvl, idx) => {
                              const step = idx + 1;
                              const isActive = currentLevel >= step;
                              return (
                                <div key={lvl} className="relative z-10 flex flex-col items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                                    {step}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-700' : 'text-slate-300'}`}>{lvl}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* 3. METRICS GRID */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4 bg-white border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fundamento</p>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-black text-slate-800">{foundationScore}</span>
                              <span className="text-xs text-slate-400 font-bold mb-1.5">/ 100</span>
                            </div>
                          </Card>
                          <Card className="p-4 bg-white border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Integración</p>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-black text-slate-800">
                                {/* Simple Integration Score Re-calc */}
                                {(() => {
                                  let s = 0;
                                  if (getAns(r, 20104).includes('ASISTÍ')) s += 40;
                                  if (getAns(r, 20106) === 'SÍ') s += 30;
                                  if (getAns(r, 20102) === 'SÍ') s += 30;
                                  return s;
                                })()}
                              </span>
                              <span className="text-xs text-slate-400 font-bold mb-1.5">%</span>
                            </div>
                          </Card>
                        </div>

                        {/* 4. ACTION PLAN */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                          <h4 className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wide mb-4">
                            <Target size={16} className="text-emerald-500" /> Plan de Acción Sugerido
                          </h4>
                          <ul className="space-y-3">
                            {profileType === 'A' && (
                              <>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Asignar mentor personal para discipulado 1 a 1.</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Inscribir en próxima clase de Bautismo.</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Invitar a servicio de búsqueda del Espíritu Santo.</li>
                              </>
                            )}
                            {profileType === 'B' && (
                              <>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-400 shrink-0" /> Integrar a grupo pequeño (sin presión).</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-400 shrink-0" /> Clarificar dudas doctrinales básicas.</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-400 shrink-0" /> Enseñar hábito de oración básica.</li>
                              </>
                            )}
                            {profileType === 'C' && (
                              <>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-rose-400 shrink-0" /> Programar consejería pastoral (foco en crisis).</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-rose-400 shrink-0" /> Conectar con red de apoyo inmediata.</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-slate-400 shrink-0" /> <strong>Nota:</strong> No presionar con doctrina hasta estabilizar.</li>
                              </>
                            )}
                            {profileType === 'D' && (
                              <>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-amber-400 shrink-0" /> Desafiar a decisión personal (separada del amigo/a).</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-amber-400 shrink-0" /> Conectar con otros miembros del mismo perfil.</li>
                                <li className="flex gap-3 text-xs text-slate-600"><CheckCircle2 size={14} className="text-amber-400 shrink-0" /> Provocar hambre espiritual propia.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'seguimiento' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <EvaluationHistory
                    person={editingPerson as Person}
                    onUpdatePerson={(updated) => {
                      setEditingPerson(updated);
                      setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                  />
                </div>
              )}

              {activeTab === 'mentoria' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-4 h-8 border-b border-indigo-100">
                      <UserCheck size={18} /> Nueva Asignación de Mentoría
                    </h4>
                    <div className="flex gap-2 mb-4">
                      {(['Member', 'Ministry', 'Body'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => { setMentorshipType(t); setMentorshipTargetId(''); }}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg border transition-all ${mentorshipType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                          {t === 'Member' ? 'Miembro' : t === 'Ministry' ? 'Ministerio' : 'Cuerpo'}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {mentorshipType === 'Member' ? (
                        <select
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                          value={mentorshipTargetId}
                          onChange={e => setMentorshipTargetId(e.target.value)}
                        >
                          <option value="">Seleccionar Miembro...</option>
                          {people.filter(p => p.id !== editingPerson.id).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                          value={mentorshipTargetId}
                          onChange={e => setMentorshipTargetId(e.target.value)}
                        >
                          <option value="">Seleccionar {mentorshipType === 'Ministry' ? 'Ministerio' : 'Cuerpo'}...</option>
                          {(mentorshipType === 'Ministry' ? appConfig.ministries : appConfig.ecclesiasticalBodies || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      )}
                      <Button
                        disabled={!mentorshipTargetId}
                        onClick={() => {
                          const targetName = mentorshipType === 'Member'
                            ? people.find(p => p.id === Number(mentorshipTargetId))?.name || 'Desconocido'
                            : mentorshipTargetId;

                          const newAssignment = {
                            id: Date.now().toString(),
                            targetType: mentorshipType,
                            targetId: mentorshipTargetId,
                            targetName: targetName,
                            startDate: new Date().toISOString(),
                            status: 'Active' as const
                          };

                          const updatedAssignments = [...(editingPerson.mentorshipAssignments || []), newAssignment];
                          setEditingPerson({ ...editingPerson, mentorshipAssignments: updatedAssignments });
                          setMentorshipTargetId('');
                        }}
                        className="bg-indigo-600 text-white"
                      >
                        <Plus size={16} /> Asignar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Asignaciones Activas ({editingPerson.mentorshipAssignments?.filter(a => a.status === 'Active').length || 0})</h4>
                    <div className="space-y-2">
                      {(editingPerson.mentorshipAssignments || []).filter(a => a.status === 'Active').length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">No hay asignaciones activas</div>
                      )}
                      {(editingPerson.mentorshipAssignments || []).filter(a => a.status === 'Active').map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-indigo-600 bg-indigo-50`}>
                              {assignment.targetType === 'Member' && <User size={14} />}
                              {assignment.targetType === 'Ministry' && <Briefcase size={14} />}
                              {assignment.targetType === 'Body' && <Users size={14} />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-700">{assignment.targetName}</div>
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{assignment.targetType === 'Member' ? 'Discipulado 1 a 1' : 'Supervisión Liderazgo'} • Desde {new Date(assignment.startDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = (editingPerson.mentorshipAssignments || []).map(a => a.id === assignment.id ? { ...a, status: 'Completed' as const } : a);
                              setEditingPerson({ ...editingPerson, mentorshipAssignments: updated });
                            }}
                            className="text-slate-300 hover:text-red-500 p-2" title="Finalizar Mentoría"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </Modal>

      {
        isSurveyModalOpen && targetPerson && (
          <SurveyTaker
            person={targetPerson}
            templates={templates}
            onClose={() => setIsSurveyModalOpen(false)}
            onSave={() => { setIsSurveyModalOpen(false); setTargetPerson(null); }}
            people={people}
            setResponses={setResponses}
            setPeople={setPeople}
          />
        )
      }

      {/* EDITOR VIEW (New Step) */}
      {
        isAnalysisEditorOpen && editingPerson && (
          <MemberAnalysisEditor
            isOpen={isAnalysisEditorOpen}
            onClose={() => setIsAnalysisEditorOpen(false)}
            person={editingPerson as Person}
            allPeople={people}
            setEvents={setEvents}
            onSave={(updatedPerson) => {
              // Update local list
              setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
              // Update current editing person
              setEditingPerson(updatedPerson);
            }}
            onGenerateReport={() => {
              setIsAnalysisEditorOpen(false);
              setIsReportOpen(true);
            }}
          />
        )
      }

      {/* INDIVIDUAL REPORT VIEW */}
      {
        isReportOpen && editingPerson && (
          <MemberReportView
            person={editingPerson}
            responses={responses}
            allPeople={people} // Passed for mentor email lookup
            onClose={() => setIsReportOpen(false)}
          />
        )
      }

      {/* Search Datalists */}
      <datalist id="comunas-list">
        {uniqueComunas.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="ciudades-list">
        {uniqueCities.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="jobs-list">
        {uniqueJobs.map(j => <option key={j} value={j} />)}
      </datalist>
      {/* Mentorship Summary Modal */}
      <Modal
        isOpen={!!viewMentorshipSummary}
        onClose={() => setViewMentorshipSummary(null)}
        title={`Resumen de Mentoría: ${viewMentorshipSummary?.name}`}
        size="md"
      >
        {viewMentorshipSummary && (
          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                <UserCheck size={24} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900">Responsabilidades de Liderazgo</h4>
                <p className="text-xs text-indigo-700/80 mt-1">
                  Gestionando {
                    (viewMentorshipSummary.mentorshipAssignments?.filter(a => a.status === 'Active').length || 0) +
                    people.filter(p => p.assignedMentorId === viewMentorshipSummary.id && p.active).length
                  } asignaciones activas.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">

              {/* 1. Implicit Assignments (Legacy) */}
              {people.filter(p => p.assignedMentorId === viewMentorshipSummary.id && p.active).map(p => (
                <div key={`implicit-${p.id}`} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 shrink-0`}>
                    <User size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-700">{p.name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discipulado (Monitor) • Activo</div>
                  </div>
                </div>
              ))}

              {/* 2. Explicit Assignments (New) */}
              {(viewMentorshipSummary.mentorshipAssignments || []).filter(a => a.status === 'Active').map(assignment => (
                <div key={assignment.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 shrink-0`}>
                    {assignment.targetType === 'Member' && <User size={14} />}
                    {assignment.targetType === 'Ministry' && <Briefcase size={14} />}
                    {assignment.targetType === 'Body' && <Users size={14} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-700">{assignment.targetName}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{assignment.targetType} • {new Date(assignment.startDate).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}

              {
                ((viewMentorshipSummary.mentorshipAssignments?.filter(a => a.status === 'Active').length || 0) +
                  people.filter(p => p.assignedMentorId === viewMentorshipSummary.id && p.active).length) === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm">Sin asignaciones activas al momento.</div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setViewMentorshipSummary(null)}>Cerrar Resumen</Button>
            </div>
          </div>
        )}
      </Modal>

    </div >
  );
};


