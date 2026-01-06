import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Save, Church,
  Shield, Download, Upload, Cloud, RefreshCw,
  Plus, X, AlertTriangle, Check, Trash2, Database,
  CloudUpload, Wifi
} from 'lucide-react';
import { MOCK_CHURCH } from '../../constants';
import { UserRole, AppConfig, Person, Family, CalendarEvent } from '../../types';
import { supabase, checkSupabaseConnection } from '../../lib/supabaseClient';

// --- CONFIGURATION CONSTANTS ---
// Definimos explícitamente qué listas gestionamos y sus títulos
const CONFIG_SECTIONS = [
  { key: 'ministries', label: 'Ministerios Oficiales' },
  { key: 'churchLocals', label: 'Locales y Anexos' },
  { key: 'churchPositions', label: 'Cargos Eclesiásticos' },
  { key: 'ecclesiasticalBodies', label: 'Cuerpos Eclesiásticos' },
  { key: 'housingStatuses', label: 'Estados de Vivienda' },
  { key: 'familyRelationships', label: 'Vínculos Familiares' },
  { key: 'surveyCategories', label: 'Categorías de Encuestas' },
] as const;

interface SettingsProps {
  role: UserRole;
  onClearAll: () => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  onRestoreFromCloud: () => Promise<void>;
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
  // Data for migration
  people: Person[];
  families: Family[];
  events: CalendarEvent[];
}

// --- SUB-COMPONENT: LIST EDITOR ---
// Componente aislado para editar una lista de strings.
const ConfigListEditor = ({
  title,
  items,
  onAdd,
  onRemove
}: {
  title: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (index: number) => void;
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.toUpperCase().trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  // Safe Items Check
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">{title}</h4>
        <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 border border-slate-200">
          {safeItems.length}
        </span>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-b border-slate-100 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nuevo..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-semibold text-slate-700"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {safeItems.length === 0 && (
          <div className="text-center py-8 text-slate-300 text-xs italic">
            Sin elementos
          </div>
        )}
        {safeItems.map((item, idx) => (
          <div key={idx} className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
            <span className="text-xs font-semibold text-slate-600 truncate mr-2">
              {/* Ensure we render a string */}
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </span>
            <button
              onClick={() => onRemove(idx)}
              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const Settings: React.FC<SettingsProps> = ({
  role,
  onClearAll,
  onExport,
  onImport,
  onRestoreFromCloud,
  appConfig,
  setAppConfig,
  people,
  families,
  events
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lists' | 'cloud'>('general');
  const [churchName, setChurchName] = useState(MOCK_CHURCH.name);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

  // -- Handlers --

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        alert("No se pudo conectar a Supabase. Verifica tu conexión a internet.");
        setSyncStatus('error');
        return;
      }
      setSyncStatus('success');
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrateData = async () => {
    if (!confirm("¿CONFIRMAS SUBIR TUS DATOS A LA NUBE?\nEsto sobrescribirá datos existentes en Supabase con los mismos IDs.")) return;

    setIsSyncing(true);
    setMigrationLog([]);
    const log = (msg: string) => setMigrationLog(prev => [...prev, msg]);

    try {
      log("🚀 Iniciando migración...");

      // 1. Config System
      log("Subiendo configuraciones...");
      for (const section of CONFIG_SECTIONS) {
        const key = section.key as keyof AppConfig;
        const value = appConfig[key];
        if (value) {
          await supabase.from('system_config').upsert({ key, value });
        }
      }

      // 2. Families
      log(`Subiendo ${families.length} familias...`);
      const { error: famError } = await supabase.from('families').upsert(
        families.map(f => ({
          id: f.id.toString(), // Ensure text
          name: f.name,
          address: f.address,
          notes: f.notes
        }))
      );
      if (famError) throw famError;

      // 3. People
      log(`Subiendo ${people.length} personas...`);
      const validPeople = people.filter(p => p.id && (p.fullName || p.fullName === "")); // Basic filter

      const { error: pplError } = await supabase.from('people').upsert(
        validPeople.map(p => ({
          id: p.id.toString(),
          name: p.fullName || "Sin Nombre", // Fallback for missing names
          email: p.email || null,
          phone: p.phone || null,
          address: p.address || null,
          birth_date: p.birthDate || null,
          gender: p.gender || 'M',
          civil_status: p.maritalStatus || null,
          profession: p.occupation || null,
          baptized: p.isBaptized || false,

          // Church
          local: p.churchLocal || null,
          position: p.churchPosition || null,
          status: p.status || 'Activo',
          ministries: p.ministries || [],

          // Family
          family_id: p.familyId ? p.familyId.toString() : null,
          family_relationship: p.familyRole || (p.familyId ? 'MIEMBRO' : null), // Simplification if role missing

          // Mentorship
          assigned_mentor_id: p.mentorId ? p.mentorId.toString() : null,
        }))
      );
      if (pplError) throw pplError;

      // 4. Events
      log(`Subiendo ${events.length} eventos...`);
      // Map events... simplified for now
      const { error: evtError } = await supabase.from('events').upsert(
        events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.type,
          start_date: e.start,
          end_date: e.end,
          assignments: e.assignments
        }))
      );
      if (evtError) throw evtError;

      log("✅ ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
      alert("¡Datos subidos correctamente a la nube!");

    } catch (e: any) {
      log(`❌ ERROR: ${e.message || e}`);
      console.error("Migration Error:", e);
      alert("Hubo un error en la migración. Revisa el log.");
    } finally {
      setIsSyncing(false);
    }
  };


  const handleAddItemToConfig = (key: keyof AppConfig, val: string) => {
    // Definitive Safety Check: Ensure AppConfig exists and key is array
    if (!appConfig) return;

    const currentList = Array.isArray(appConfig[key]) ? appConfig[key] : [];
    const newList = [...currentList, val];

    setAppConfig({
      ...appConfig,
      [key]: newList
    });
  };

  const handleRemoveItemFromConfig = (key: keyof AppConfig, idx: number) => {
    if (!appConfig) return;

    const currentList = Array.isArray(appConfig[key]) ? appConfig[key] : [];
    const newList = [...currentList];
    newList.splice(idx, 1);

    setAppConfig({
      ...appConfig,
      [key]: newList
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (confirm('¿IMPORTAR backup? Esto reemplazará los datos actuales.')) {
        onImport(e.target.files[0]);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
            <p className="text-slate-500 font-medium">Sistema de Gestión Eclesiástica</p>
          </div>
        </div>

        {/* TABS SEGMENTED CONTROL */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'lists' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Listas y Opciones
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'cloud' ? 'bg-emerald-50 shadow-sm text-emerald-600 border border-emerald-200' : 'text-slate-400 hover:text-emerald-600'}`}
          >
            Nube (Supabase)
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="space-y-8">

        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-300">

            {/* PANEL: IDENTIDAD */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Church className="text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-800">Identidad Institucional</h3>
              </div>
              <div className="space-y-4 max-w-lg">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nombre de la Iglesia</label>
                <input
                  value={churchName}
                  onChange={e => setChurchName(e.target.value)}
                  className="w-full text-lg font-bold text-slate-700 border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 px-1 bg-transparent transition-colors"
                />
                <p className="text-xs text-slate-400">Este nombre aparecerá en reportes o documentos impresos.</p>
              </div>
            </div>

            {/* PANEL: DATA MANAGEMENT */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Database className="text-blue-500" />
                <h3 className="text-lg font-bold text-slate-800">Gestión de Datos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EXPORT */}
                <button
                  onClick={onExport}
                  className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Download size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-700">Respaldar Datos</div>
                      <div className="text-xs text-slate-500">Descargar archivo .json</div>
                    </div>
                  </div>
                </button>

                {/* IMPORT */}
                <label className="cursor-pointer relative flex items-center justify-between p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                  <input type="file" accept=".json" onChange={handleFileImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-700">Restaurar Copia</div>
                      <div className="text-xs text-slate-500">Subir archivo .json</div>
                    </div>
                  </div>
                </label>

                {/* CLOUD */}
                {/* RESET REMOVED */}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLOUD */}
        {activeTab === 'cloud' && (
          <div className="bg-white p-10 rounded-[2rem] border border-emerald-100 shadow-lg shadow-emerald-900/5 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                <CloudUpload size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Sincronización Cloud (Supabase)</h3>
                <p className="text-slate-500">Estado: {syncStatus === 'success' ? 'Conectado' : syncStatus === 'error' ? 'Error de Conexión' : 'Desconectado'}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Wifi size={16} /> Prueba de Conexión
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Verifica que tu proyecto en Supabase está accesible. Si ves "Success", estamos listos para migrar.
              </p>
              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSyncing ? <RefreshCw className="animate-spin" /> : <Check />}
                {isSyncing ? 'Verificando...' : 'Probar Conexión'}
              </button>
            </div>

            {syncStatus === 'success' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                  <strong>¡Conexión Exitosa!</strong> El sistema ha detectado tu base de datos en la nube.
                </div>

                <button
                  onClick={handleMigrateData}
                  disabled={isSyncing}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                >
                  <CloudUpload size={24} />
                  {isSyncing ? 'MIGRANDO...' : 'MIGRAR TODOS MIS DATOS AHORA'}
                </button>

                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono h-40 overflow-y-auto">
                  {migrationLog.length === 0 ? '> Esperando inicio...' : migrationLog.map((l, i) => <div key={i}>{">"} {l}</div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LISTS */}
        {activeTab === 'lists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Ensure configuration exists before mapping */}
            {!appConfig && (
              <div className="col-span-full p-10 text-center bg-red-50 text-red-600 rounded-xl">
                Error Crítico: No se cargó la configuración.
              </div>
            )}

            {/* SAFE ITERATION OVER DEFINED SECTIONS */}
            {appConfig && CONFIG_SECTIONS.map((section) => (
              <ConfigListEditor
                key={section.key}
                title={section.label}
                items={appConfig[section.key as keyof AppConfig] || []}
                onAdd={(val) => handleAddItemToConfig(section.key as keyof AppConfig, val)}
                onRemove={(idx) => handleRemoveItemFromConfig(section.key as keyof AppConfig, idx)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
