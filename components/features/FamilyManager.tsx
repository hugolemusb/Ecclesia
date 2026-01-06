
import React, { useState, useMemo } from 'react';
import {
  UsersRound, MapPin, Plus, Search, Edit2, X, Save,
  Trash2, UserCircle, ChevronRight, ClipboardCheck, Home, Heart, Baby, Info
} from 'lucide-react';
import { Family, Person, HousingStatus, FamilyRelationshipStatus, AppConfig } from '../../types';
import { RELATIONSHIPS } from '../../constants'; // Keep if needed for defaults, but better use AppConfig
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Card from '../ui/Card';

interface FamilyManagerProps {
  families: Family[];
  setFamilies: React.Dispatch<React.SetStateAction<Family[]>>;
  people: Person[];
  appConfig: AppConfig;
}

const FamilyManager: React.FC<FamilyManagerProps> = ({ families, setFamilies, people, appConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpedienteOpen, setIsExpedienteOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [editingFamily, setEditingFamily] = useState<Partial<Family> | null>(null);



  const sortedFamilies = useMemo(() => {
    const term = searchTerm.toUpperCase();
    return families
      .filter(f => f.name.toUpperCase().includes(term) || f.members.some(m => people.find(p => p.id === m.personId)?.name.toUpperCase().includes(term)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [families, searchTerm, people]);

  const filteredPeopleForSearch = useMemo(() => {
    const term = memberSearchTerm.toUpperCase();
    if (!term) return [];
    const selectedIds = (editingFamily?.members || []).map(m => m.personId);
    return people
      .filter(p => p.name.toUpperCase().includes(term) && !selectedIds.includes(p.id))
      .slice(0, 5);
  }, [people, memberSearchTerm, editingFamily?.members]);

  const handleCreate = () => {
    setEditingFamily({
      id: Date.now(),
      name: '',
      address: '',
      members: [],
      headOfFamily: '',
      relationshipStatus: 'Ninguno',
      housingStatus: 'Arriendo',
      numberOfChildren: 0,
      notes: '',
      iglesiaId: 1
    });
    setMemberSearchTerm('');
    setIsModalOpen(true);
  };

  const handleEdit = (f: Family) => {
    setEditingFamily({ ...f });
    setMemberSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingFamily?.name || !editingFamily.name.trim()) {
      alert("EL NOMBRE DE LA FAMILIA ES OBLIGATORIO.");
      return;
    }
    if (!editingFamily.members || editingFamily.members.length === 0) {
      alert("DEBE AGREGAR AL MENOS UN INTEGRANTE.");
      return;
    }

    const familyToSave = {
      ...editingFamily,
      name: editingFamily.name.toUpperCase(),
      address: (editingFamily.address || '').toUpperCase(),
      notes: (editingFamily.notes || '').toUpperCase(),
    } as Family;

    setFamilies(prev => {
      const exists = prev.find(f => f.id === familyToSave.id);
      return exists ? prev.map(f => f.id === familyToSave.id ? familyToSave : f) : [...prev, familyToSave];
    });

    setIsModalOpen(false);
    setEditingFamily(null);
  };

  const toggleMember = (personId: number) => {
    if (!editingFamily) return;
    const currentMembers = [...(editingFamily.members || [])];
    const index = currentMembers.findIndex(m => m.personId === personId);

    if (index > -1) {
      const isHead = editingFamily.headOfFamilyId === personId;
      currentMembers.splice(index, 1);
      setEditingFamily({
        ...editingFamily,
        members: currentMembers,
        headOfFamily: isHead ? '' : editingFamily.headOfFamily,
        headOfFamilyId: isHead ? undefined : editingFamily.headOfFamilyId
      });
    } else {
      const person = people.find(p => p.id === personId);
      if (!person) return;
      setEditingFamily({
        ...editingFamily,
        members: [...currentMembers, { personId, relationship: 'MIEMBRO' }],
        headOfFamily: currentMembers.length === 0 ? person.name : editingFamily.headOfFamily,
        headOfFamilyId: currentMembers.length === 0 ? person.id : editingFamily.headOfFamilyId,
        address: editingFamily.address || person.address
      });
      setMemberSearchTerm('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Input
            icon={<Search size={18} />}
            placeholder="BUSCAR GRUPO FAMILIAR POR APELLIDO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            className="font-bold uppercase"
          />
        </div>
        <Button onClick={handleCreate} leftIcon={<Plus size={18} />} className="uppercase text-xs tracking-widest shadow-xl bg-slate-900 hover:bg-black">
          Nuevo Grupo Familiar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFamilies.map((family) => (
          <Card key={family.id} className="overflow-hidden group p-0 border-0 shadow-sm hover:shadow-xl rounded-[2rem]">
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <UsersRound size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">{family.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> {family.address}</p>
                  </div>
                </div>
                <button onClick={() => handleEdit(family)} className="p-2 text-slate-300 hover:text-blue-600 transition-all"><Edit2 size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Jefe de Hogar</p>
                  <p className="text-[11px] font-bold uppercase truncate text-slate-700">{family.headOfFamily || 'PENDIENTE'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vínculo</p>
                  <p className="text-[11px] font-bold uppercase text-slate-700">{family.relationshipStatus || 'NO DEF.'}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => { setSelectedFamily(family); setIsExpedienteOpen(true); }}
                className="w-full bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-500 text-[10px] uppercase tracking-widest border border-slate-100 shadow-none justify-between"
                rightIcon={<ChevronRight size={14} />}
                leftIcon={<ClipboardCheck size={16} />}
              >
                Ver Expediente Familiar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen && !!editingFamily}
        onClose={() => setIsModalOpen(false)}
        title="Registro de Núcleo Familiar"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="uppercase text-[11px] tracking-widest px-8 py-4 rounded-2xl">Cancelar</Button>
            <Button onClick={handleSave} leftIcon={<Save size={20} />} className="uppercase text-[11px] tracking-widest px-12 py-4 rounded-2xl shadow-xl">Guardar Grupo Familiar</Button>
          </>
        }
      >
        {editingFamily && (
          <div className="space-y-10">
            {/* Sección 1: Datos Hogar */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Home size={18} className="text-blue-600" />
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Antecedentes del Hogar</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nombre Familia (Apellidos)" value={editingFamily.name || ''} onChange={(e) => setEditingFamily({ ...editingFamily, name: e.target.value.toUpperCase() })} placeholder="EJ: FAMILIA SOTO MAYORGA" className="font-bold uppercase" />
                <Input label="Dirección / Domicilio" value={editingFamily.address || ''} onChange={(e) => setEditingFamily({ ...editingFamily, address: e.target.value.toUpperCase() })} placeholder="EJ: AV. SAN PABLO 1234, DEPTO 502" className="font-bold uppercase" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Relación</label>
                  <select value={editingFamily.relationshipStatus} onChange={(e) => setEditingFamily({ ...editingFamily, relationshipStatus: e.target.value as any })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600">
                    {['Casados', 'Conviviente', 'Separado', 'Novios', 'Ninguno'].map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Vivienda</label>
                  <select value={editingFamily.housingStatus} onChange={(e) => setEditingFamily({ ...editingFamily, housingStatus: e.target.value as any })} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600">
                    {appConfig.housingStatuses.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
                <Input type="number" label="Cantidad de Hijos" value={editingFamily.numberOfChildren || 0} onChange={(e) => setEditingFamily({ ...editingFamily, numberOfChildren: parseInt(e.target.value) })} className="font-bold" />
              </div>
            </div>

            {/* Sección 2: Miembros */}
            <div className="space-y-6 pt-10 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-rose-500" />
                  <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em]">Integrantes del Grupo</h4>
                </div>
                <div className="relative w-full max-w-xs">
                  <Input
                    icon={<Search size={14} />}
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value.toUpperCase())}
                    placeholder="AÑADIR INTEGRANTE..."
                    className="bg-slate-900 text-white border-transparent text-[10px] font-black uppercase tracking-widest focus:ring-blue-600/20 shadow-xl placeholder:text-slate-500"
                  />
                  {filteredPeopleForSearch.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 mt-2 overflow-hidden animate-in slide-in-from-top-2">
                      {filteredPeopleForSearch.map(p => (
                        <button key={p.id} onClick={() => toggleMember(p.id)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 border-b last:border-0 transition-colors">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-black uppercase text-slate-900">{p.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{p.local}</span>
                          </div>
                          <Plus size={16} className="text-blue-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(editingFamily.members || []).map(m => {
                  const p = people.find(person => person.id === m.personId);
                  if (!p) return null;
                  return (
                    <div key={m.personId} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-blue-600 text-xs shadow-sm">
                            {p.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-xs font-black uppercase text-slate-900">{p.name}</p>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{m.relationship || 'VÍNCULO NO DEF.'}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleMember(p.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asignar Vínculo Familiar:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {appConfig.familyRelationships.map(rel => (
                            <button key={rel} onClick={() => {
                              const isJefe = rel === 'jefe(a) de hogar';
                              setEditingFamily({
                                ...editingFamily,
                                headOfFamily: isJefe ? p.name : editingFamily.headOfFamily,
                                headOfFamilyId: isJefe ? p.id : editingFamily.headOfFamilyId,
                                members: editingFamily.members?.map(me => me.personId === p.id ? { ...me, relationship: rel } : me)
                              });
                            }}
                              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${m.relationship === rel ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'}`}
                            >
                              {rel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(editingFamily.members?.length || 0) === 0 && (
                  <div className="md:col-span-2 text-center py-16 border-4 border-dashed border-slate-50 rounded-[3rem] opacity-40">
                    <Baby size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Añada integrantes al grupo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sección 3: Notas */}
            <div className="space-y-4 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-amber-500" />
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Observaciones Pastorales / Notas del Hogar</label>
              </div>
              <textarea
                value={editingFamily.notes || ''}
                onChange={(e) => setEditingFamily({ ...editingFamily, notes: e.target.value.toUpperCase() })}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-bold uppercase h-32 outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                placeholder="INFORMACIÓN ADICIONAL RELEVANTE PARA EL PASTOR..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Expediente Familiar Modal - Restaurado con Estética Completa */}
      <Modal
        isOpen={isExpedienteOpen && !!selectedFamily}
        onClose={() => setIsExpedienteOpen(false)}
        title="Expediente Familiar"
        size="lg"
        footer={
          <Button onClick={() => setIsExpedienteOpen(false)} variant="primary" className="px-12 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl">Cerrar Expediente</Button>
        }
      >
        {selectedFamily && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jefe de Hogar</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{selectedFamily.headOfFamily || 'NO DEFINIDO'}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vivienda</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{selectedFamily.housingStatus}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Relación</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{selectedFamily.relationshipStatus}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cant. Hijos</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{selectedFamily.numberOfChildren}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Árbol de Integrantes Vinculados</p>
              <div className="grid grid-cols-1 gap-3">
                {selectedFamily.members.map((m) => {
                  const p = people.find(person => person.id === m.personId);
                  return (
                    <div key={m.personId} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase">{p?.name.charAt(0)}</div>
                        <div className="flex flex-col">
                          <p className="text-sm font-black uppercase text-slate-800">{p?.name || 'DESCONOCIDO'}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.relationship}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{p?.age} Años</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedFamily.notes && (
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest flex items-center gap-2"><Info size={12} /> Notas Pastorales</p>
                <p className="text-sm text-amber-900 italic font-bold uppercase leading-relaxed">"{selectedFamily.notes}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FamilyManager;
