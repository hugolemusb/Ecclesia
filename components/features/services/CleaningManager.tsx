import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, Plus, Edit2, Trash2, Save, X, AlertCircle, Users, Key, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CleaningGroup, ChurchService, CleaningScheduleItem, Absence, UrgentCleaning, CleaningExportConfig, ViewMode, ManualPerson, EventObservation } from '../../../../types/cleaning';
import { getRandomVerse } from '../../../../services/bibleVerses';
import { exportToTXT } from './exports/TXTExporter';
import { exportToEcclesiaCalendar } from './exports/CalendarIntegration';
import { exportToPDF } from './exports/PDFExporter';
import { db } from '../../../../db';

export const CleaningManager: React.FC = () => {
  const [groups, setGroups] = useState<CleaningGroup[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [schedule, setSchedule] = useState<CleaningScheduleItem[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [urgentCleanings, setUrgentCleanings] = useState<UrgentCleaning[]>([]);
  
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showUrgentForm, setShowUrgentForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CleaningGroup | null>(null);
  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [activeTab

, setActiveTab] = useState('schedule');

  const [absenceForm, setAbsenceForm] = useState({
    scheduleId: '',
    reason: '',
    type: 'vacation' as const,
    replacementGroupId: '',
    replacementMembers: '',
    notes: ''
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    coordinator: '',
    members: '',
    phone: '',
    keyHolder: '',
    preferredTime: '',
    scheduledDate: '',
    arrivalTime: ''
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    day: '' as const,
    time: '',
    requiresCleaning: true
  });

  const [urgentForm, setUrgentForm] = useState({
    date: '',
    time: '',
    reason: '',
    groupId: '',
    details: ''
  });

  const [exportConfig, setExportConfig] = useState<CleaningExportConfig>({
    churchName: '',
    address: '',
    phone: '',
    email: '',
    pastor: '',
    includeHeader: true,
    includeFooter: true,
    additionalNotes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateMonthlySchedule();
  }, [groups, services, currentMonth, absences, urgentCleanings]);

  const loadData = async () => {
    try {
      const state = await db.loadAll();
      
      if (state.cleaningGroups) setGroups(state.cleaningGroups);
      if (state.cleaningServices) setServices(state.cleaningServices);
      if (state.cleaningAbsences) setAbsences(state.cleaningAbsences);
      if (state.urgentCleanings) setUrgentCleanings(state.urgentCleanings);
      if (state.cleaningConfig) setExportConfig(state.cleaningConfig);
    } catch (error) {
      console.log('Iniciando con datos vacíos');
    }
  };

  const saveData = async () => {
    try {
      const state = await db.loadAll();
      await db.saveAll({
        ...state,
        cleaningGroups: groups,
        cleaningServices: services,
        cleaningAbsences: absences,
        urgentCleanings: urgentCleanings,
        cleaningConfig: exportConfig
      });
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  useEffect(() => {
    if (groups.length > 0 || services.length > 0 || absences.length > 0 || urgentCleanings.length > 0) {
      saveData();
    }
  }, [groups, services, absences, urgentCleanings, exportConfig]);


  const addManualPerson = () => {
    if (!personForm.name || !personForm.phone) {
      alert('Complete nombre y teléfono');
      return;
    }
    setManualPersons([...manualPersons, { name: personForm.name, phone: personForm.phone }]);
    setPersonForm({ name: '', phone: '' });
  };

  const removeManualPerson = (index: number) => {
    setManualPersons(manualPersons.filter((_, i) => i !== index));
  };

  const getFilteredSchedule = () => {
    if (!dateRange.start && !dateRange.end) return schedule;
    return schedule.filter(item => {
      const itemDate = new Date(item.date);
      if (dateRange.start && itemDate < dateRange.start) return false;
      if (dateRange.end && itemDate > dateRange.end) return false;
      return true;
    });
  };

  const addGroup = () => {
    if (!groupForm.name || !groupForm.coordinator) return;

    const newGroup: CleaningGroup = {
      id: Date.now(),
      ...groupForm,
      members: groupForm.members.split(',').map(m => m.trim()).filter(m => m)
    };

    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? { ...newGroup, id: editingGroup.id } : g));
      setEditingGroup(null);
    } else {
      setGroups([...groups, newGroup]);
    }

    setGroupForm({ name: '', coordinator: '', members: '', phone: '', keyHolder: '', preferredTime: '',
    scheduledDate: '',
    arrivalTime: '' });
    setShowGroupForm(false);
  };

  const deleteGroup = (id: number) => {
    if (window.confirm('¿Eliminar este grupo?')) {
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  const editGroup = (group: CleaningGroup) => {
    setEditingGroup(group);
    setGroupForm({
      ...group,
      members: group.members.join(', ')
    });
    setShowGroupForm(true);
  };

  const addService = () => {
    if (!serviceForm.name || !serviceForm.day || !serviceForm.time) return;

    const newService: ChurchService = {
      id: Date.now(),
      ...serviceForm,
      day: serviceForm.day as any
    };

    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? { ...newService, id: editingService.id } : s));
      setEditingService(null);
    } else {
      setServices([...services, newService]);
    }

    setServiceForm({ name: '', day: '' as any, time: '', requiresCleaning: true });
    setShowServiceForm(false);
  };

  const deleteService = (id: number) => {
    if (window.confirm('¿Eliminar este servicio?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const editService = (service: ChurchService) => {
    setEditingService(service);
    setServiceForm(service);
    setShowServiceForm(true);
  };

  const generateMonthlySchedule = () => {
    if (groups.length === 0 || services.length === 0) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const newSchedule: CleaningScheduleItem[] = [];

    const cleaningServices = services.filter(s => s.requiresCleaning);
    const dayMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      cleaningServices.forEach((service, idx) => {
        if (dayMap[service.day] === dayOfWeek) {
          const weekOfMonth = Math.floor((day - 1) / 7);
          const groupIndex = (weekOfMonth + idx) % groups.length;
          const assignedGroup = groups[groupIndex];
          const dateStr = date.toISOString().split('T')[0];

          const absence = absences.find(a => a.scheduleDate === dateStr && a.originalGroupId === assignedGroup.id);

          newSchedule.push({
            id: `\${dateStr}-\${service.id}`,
            date: dateStr,
            day: date.toLocaleDateString('es-ES', { weekday: 'long' }),
            service: service.name,
            serviceTime: service.time,
            group: assignedGroup,
            weekNumber: weekOfMonth + 1,
            absence: absence || null
          });
        }
      });
    }

    // Add urgent cleanings
    urgentCleanings.forEach(urgent => {
      newSchedule.push({
        id: urgent.id,
        date: urgent.date,
        day: new Date(urgent.date).toLocaleDateString('es-ES', { weekday: 'long' }),
        service: '🚨 ASEO URGENTE',
        serviceTime: urgent.time,
        group: urgent.assignedGroup,
        weekNumber: Math.floor((new Date(urgent.date).getDate() - 1) / 7) + 1,
        absence: null
      });
    });

    newSchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setSchedule(newSchedule);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex items-center gap-4">
              <span className="text-6xl">🧹</span>
              <div>
                <h1 className="text-4xl font-bold">Sistema de Gestión de Aseo</h1>
                <p className="text-blue-100 mt-2">Organización y coordinación del templo</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex gap-1 p-2">
              {['schedule', 'urgent', 'groups', 'services', 'export'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all $\{
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'schedule' && '📅 Programación'}
                  {tab === 'urgent' && '🚨 SOS Urgente'}
                  {tab === 'groups' && '👥 Grupos'}
                  {tab === 'services' && '⛪ Servicios'}
                  {tab === 'export' && '📤 Exportar'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'schedule' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      ← Anterior
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={() => changeMonth(1)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Siguiente →
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('weekly')}
                      className={`px-4 py-2 rounded-lg $\{viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      📅 Semanal
                    </button>
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-4 py-2 rounded-lg $\{viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      📆 Mensual
                    </button>
                  </div>
                </div>

                {schedule.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">Primero configura grupos y servicios</p>
                  </div>
                ) : (
                  <div>
                    {viewMode === 'weekly' && (
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                          onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                          className="px-3 py-1 bg-gray-200 rounded"
                        >
                          ← Semana Anterior
                        </button>
                        <span className="font-semibold">Semana {selectedWeek}</span>
                        <button
                          onClick={() => setSelectedWeek(Math.min(5, selectedWeek + 1))}
                          className="px-3 py-1 bg-gray-200 rounded"
                        >
                          Siguiente Semana →
                        </button>
                      </div>
                    )}
                    {[...new Set(schedule.filter(s => viewMode === 'monthly' || s.weekNumber === selectedWeek).map(s => s.weekNumber))].map(weekNum => (
                      <div key={weekNum} className="mb-8">
                        <div className="bg-blue-600 text-white px-6 py-3 rounded-t-lg font-bold text-lg">
                          SEMANA {weekNum}
                        </div>
                        <div className="border border-blue-200 rounded-b-lg overflow-hidden">
                          {schedule.filter(s => s.weekNumber === weekNum).map((item, idx) => (
                            <div key={idx} className={`p-6 border-b border-gray-200 last:border-b-0 $\{
                              item.service.includes('URGENTE') ? 'bg-red-50 border-l-4 border-l-red-500' :
                              item.absence ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : 'hover:bg-gray-50'
                            }`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold text-lg">
                                      {new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES')} - {item.day}
                                    </span>
                                  </div>
                                  <p><span className="text-gray-600">Servicio:</span> {item.service} ({item.serviceTime})</p>
                                  <p><span className="text-gray-600">Grupo:</span> {item.group.name}</p>
                                </div>
                                <div>
                                  <p><strong>Coordinador:</strong> {item.group.coordinator}</p>
                                  <p><strong>Teléfono:</strong> {item.group.phone}</p>
                                  <p><strong>Llaves:</strong> {item.group.keyHolder}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'urgent' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">🚨 Aseo Urgente</h2>
                <div className="bg-red-50 border-2 border-red-400 p-6 rounded-lg mb-6">
                  <h3 className="font-bold text-lg mb-4">Crear Evento Urgente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={urgentForm.date}
                      onChange={(e) => setUrgentForm({ ...urgentForm, date: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="time"
                      value={urgentForm.time}
                      onChange={(e) => setUrgentForm({ ...urgentForm, time: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Motivo (ej: Evento especial)"
                      value={urgentForm.reason}
                      onChange={(e) => setUrgentForm({ ...urgentForm, reason: e.target.value })}
                      className="px-4 py-2 border rounded-lg col-span-2"
                    />
                    <select
                      value={urgentForm.groupId}
                      onChange={(e) => setUrgentForm({ ...urgentForm, groupId: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar grupo</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Detalles adicionales..."
                      value={urgentForm.details}
                      onChange={(e) => setUrgentForm({ ...urgentForm, details: e.target.value })}
                      className="px-4 py-2 border rounded-lg col-span-2 h-20"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!urgentForm.date || !urgentForm.time || !urgentForm.groupId) return;
                      const group = groups.find(g => g.id === parseInt(urgentForm.groupId));
                      if (!group) return;
                      
                      const newUrgent: UrgentCleaning = {
                        id: `urgent-\${Date.now()}`,
                        date: urgentForm.date,
                        time: urgentForm.time,
                        reason: urgentForm.reason,
                        assignedGroup: group,
                        details: urgentForm.details,
                        type: 'urgent',
                        createdAt: new Date()
                      };
                      
                      setUrgentCleanings([...urgentCleanings, newUrgent]);
                      setUrgentForm({ date: '', time: '', reason: '', groupId: '', details: '' });
                    }}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Crear Aseo Urgente
                  </button>
                </div>

                <div className="space-y-4">
                  {urgentCleanings.map(urgent => (
                    <div key={urgent.id} className="bg-red-100 border-2 border-red-300 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">🚨 {urgent.reason}</p>
                          <p>{new Date(urgent.date).toLocaleDateString('es-ES')} - {urgent.time}</p>
                          <p className="text-sm">Grupo: {urgent.assignedGroup.name}</p>
                        </div>
                        <button
                          onClick={() => setUrgentCleanings(urgentCleanings.filter(u => u.id !== urgent.id))}
                          className="p-2 text-red-600 hover:bg-red-200 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Grupos de Aseo</h2>
                  <button
                    onClick={() => {
                      setShowGroupForm(!showGroupForm);
                      setEditingGroup(null);
                      setGroupForm({ name: '', coordinator: '', members: '', phone: '', keyHolder: '', preferredTime: '',
    scheduledDate: '',
    arrivalTime: '' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showGroupForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showGroupForm ? 'Cancelar' : 'Nuevo Grupo'}
                  </button>
                </div>

                {showGroupForm && (
                  <div className="bg-green-50 p-6 rounded-lg mb-6 border-2 border-green-200">
                    <h3 className="font-bold text-lg mb-4">{editingGroup ? 'Editar' : 'Nuevo'} Grupo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del grupo"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Coordinador"
                        value={groupForm.coordinator}
                        onChange={(e) => setGroupForm({ ...groupForm, coordinator: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={groupForm.phone}
                        onChange={(e) => setGroupForm({ ...groupForm, phone: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Encargado de llaves"
                        value={groupForm.keyHolder}
                        onChange={(e) => setGroupForm({ ...groupForm, keyHolder: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Horario (ej: 8:00 AM)"
                        value={groupForm.preferredTime}
                        onChange={(e) => setGroupForm({ ...groupForm, preferredTime: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Miembros (separados por comas)"
                        value={groupForm.members}
                        onChange={(e) => setGroupForm({ ...groupForm, members: e.target.value })}
                        className="px-4 py-2 border rounded-lg md:col-span-2"
                      />
                    </div>
                    <button
                      onClick={addGroup}
                      className="mt-4 flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <div key={group.id} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-blue-600">{group.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editGroup(group)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Coordinador:</strong> {group.coordinator}</p>
                        <p><strong>Teléfono:</strong> {group.phone}</p>
                        <p><strong>Llaves:</strong> {group.keyHolder}</p>
                        <p><strong>Horario:</strong> {group.preferredTime}</p>
                        <p><strong>Miembros:</strong> {group.members.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Servicios</h2>
                  <button
                    onClick={() => {
                      setShowServiceForm(!showServiceForm);
                      setEditingService(null);
                      setServiceForm({ name: '', day: '' as any, time: '', requiresCleaning: true });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showServiceForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showServiceForm ? 'Cancelar' : 'Nuevo Servicio'}
                  </button>
                </div>

                {showServiceForm && (
                  <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200">
                    <h3 className="font-bold text-lg mb-4">{editingService ? 'Editar' : 'Nuevo'} Servicio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del servicio"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <select
                        value={serviceForm.day}
                        onChange={(e) => setServiceForm({ ...serviceForm, day: e.target.value as any })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="">Seleccionar día</option>
                        <option value="Domingo">Domingo</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Hora (ej: 10:00 AM)"
                        value={serviceForm.time}
                        onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={serviceForm.requiresCleaning}
                          onChange={(e) => setServiceForm({ ...serviceForm, requiresCleaning: e.target.checked })}
                        />
                        Requiere aseo
                      </label>
                    </div>
                    <button
                      onClick={addService}
                      className="mt-4 flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-blue-600">{service.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteService(service.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p><strong>Día:</strong> {service.day}</p>
                      <p><strong>Hora:</strong> {service.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Configuración y Exportación</h2>
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="font-bold text-lg mb-4">Información de la Iglesia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre de la iglesia"
                      value={exportConfig.churchName}
                      onChange={(e) => setExportConfig({ ...exportConfig, churchName: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={exportConfig.address}
                      onChange={(e) => setExportConfig({ ...exportConfig, address: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={exportConfig.phone}
                      onChange={(e) => setExportConfig({ ...exportConfig, phone: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Pastor"
                      value={exportConfig.pastor}
                      onChange={(e) => setExportConfig({ ...exportConfig, pastor: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => exportToTXT(schedule, exportConfig, currentMonth)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg"
                    disabled={schedule.length === 0}
                  >
                    <FileText className="w-5 h-5 inline mr-2" />
                    Exportar TXT
                  </button>
                  <button
                    onClick={async () => { const result = await exportToEcclesiaCalendar(schedule); alert(result.message); }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg"
                    disabled={schedule.length === 0}
                  >
                    <Calendar className="w-5 h-5 inline mr-2" />
                    Exportar a Calendario Ecclesia
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
