import { AppState, HistoricoRegistro, ArchivoGuardado } from './types';
import { MOCK_PEOPLE, MOCK_FAMILIES, MOCK_TEMPLATES } from './constants';
// import { firebaseAdapter } from './firebaseAdapter';
import { firebaseAdapter } from './firebaseAdapter';

const KEY = 'app:historico';
const ARCHIVOS_KEY = 'app:archivos';

// Simple implementation of the requested "window.storage" interface using localStorage
const storage = {
  get: async (key: string) => {
    const val = localStorage.getItem(key);
    return val ? { value: val } : null;
  },
  set: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Storage Error (Quota Exceeded?):", e);
      alert("Error al guardar: Almacenamiento lleno. Intente exportar y limpiar datos.");
    }
  },
  delete: async (key: string) => {
    localStorage.removeItem(key);
  }
};

export const db = {
  // 1. CARGAR datos al inicio SIEMPRE
  loadAll: async (): Promise<AppState> => {
    // FORCE LOCAL FIRST for stability
    console.log("DB: Iniciando carga de datos...")

    // Default structure (Always needed as fallback)
    const defaultState: AppState = {
      people: MOCK_PEOPLE,
      families: MOCK_FAMILIES,
      surveyResponses: [],
      surveyTemplates: MOCK_TEMPLATES,
      configuracion: {
        currentUser: null,
        lastTab: 'dashboard'
      },
      events: [], // Initialize empty events array
      historico: [{
        id: Date.now(),
        fecha: new Date().toISOString(),
        accion: 'sistema',
        detalles: 'Inicialización del sistema con datos por defecto',
        datos: null
      }],
      archivos: [],
      dismissedNoticeIds: [],
      ultimaModificacion: new Date().toISOString()
    };

    try {
      const res = await storage.get(KEY);
      if (res && res.value) {
        console.log("DB: Datos encontrados en caché local");
        try {
          const parsed = JSON.parse(res.value);
          // Validaciones mínimas para evitar crash
          if (!parsed.people) throw new Error("Datos corruptos");
          if (!parsed.historico) parsed.historico = [];
          if (!parsed.archivos) parsed.archivos = [];

          // AUTO-RECOVERY SNAPSHOT: Save successful load as backup
          await storage.set('app:recovery', res.value);

          return parsed;
        } catch (parseError) {
          console.error("DB: Error al procesar caché local, intentando recuperación", parseError);
        }
      }

      // Fallback: Try Recovery if Main Failed or Empty
      const recovery = await storage.get('app:recovery');
      if (recovery && recovery.value) {
        console.warn("DB: Usando punto de restauración de emergencia");
        try {
          const parsedRec = JSON.parse(recovery.value);
          return parsedRec;
        } catch (e) { console.error("Recovery also failed", e); }
      }

    } catch (e) {
      console.error('DB: Error crítico en storage, usando defaults', e);
    }

    // SAFETY CHECK: If we are here, it means we didn't find data or failed to parse.
    // If we simply return defaultState and then SAVE it later, we wipe previous data.
    // We should ONLY return defaultState if we are sure there was no previous data.

    // Check if key exists but failed to load?
    // For now, allow default initialization but log heavily.
    // Ideally, we don't save defaults back to storage immediately unless confirmed empty.

    console.log("DB: Usando estado por defecto (Nueva sesión o limpieza)");
    // DO NOT overwrite immediately to allow recovery from other tabs/sessions if needed
    // await storage.set(KEY, JSON.stringify(defaultState)); 

    return defaultState;

    // SOLO sincronización pasiva si funciona, nunca bloqueante
    /*
    try {
      if (firebaseAdapter.isEnabled()) {
        firebaseAdapter.loadAll().then(cloudData => {
          if (cloudData) {
            console.log("☁️ Cloud Data Found (Async)");
            // Aquí podríamos notificar al usuario para recargar
            storage.set(KEY, JSON.stringify(cloudData));
          }
        }).catch(e => console.warn("Cloud sync ignored"));
      }
    } catch (e) {}
    */

    return defaultState;
  },

  // 2. GUARDAR AUTOMÁTICAMENTE en cada cambio
  saveAll: async (state: AppState) => {
    const newState = {
      ...state,
      ultimaModificacion: new Date().toISOString()
    };

    // Guardar en local siempre (Fast UX)
    await storage.set(KEY, JSON.stringify(newState));

    // Sincronizar con Firebase (Background)
    /*
    if (firebaseAdapter.isEnabled()) {
      // No esperamos el await para no bloquear la UI
      firebaseAdapter.saveAll(newState).catch(e => console.error("Error background sync:", e));
    }
    */
  },

  // 3. RESTAURAR DESDE NUBE (Manual)
  restoreFromCloud: async (): Promise<boolean> => {
    try {
      if (!firebaseAdapter.isEnabled()) return false;

      console.log("DB: Intentando restaurar desde nube...");
      const cloudData = await firebaseAdapter.loadAll();

      if (cloudData) {
        // Guardar en local
        await storage.set(KEY, JSON.stringify(cloudData));
        console.log("DB: Restauración exitosa. Recargando...");
        return true;
      }
      return false;
    } catch (e) {
      console.error("DB: Error restaurando desde nube:", e);
      return false;
    }
  },

  // Histórico de cambios
  agregarEventoHistorico: async (state: AppState, accion: HistoricoRegistro['accion'], detalles: string, datos?: any): Promise<AppState> => {
    const nuevoRegistro: HistoricoRegistro = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      accion: accion,
      detalles: detalles,
      datos: datos // Opcional: guardar snapshot de lo cambiado
    };

    const newState = {
      ...state,
      historico: [...state.historico, nuevoRegistro].slice(-500) // Mantener últimos 500 para evitar overflow
    };

    await db.saveAll(newState);
    return newState;
  },

  // Gestión de Archivos
  saveArchivo: async (nombre: string, contenido: string, tipo: string, currentFiles: ArchivoGuardado[]) => {
    // Check quota roughly
    if (contenido.length > 3000000) { // ~3MB limit warning
      if (!confirm("El archivo es muy grande y podría llenar el almacenamiento local. ¿Continuar?")) return currentFiles;
    }

    const nuevoArchivo: ArchivoGuardado = {
      id: Date.now(),
      nombre,
      fecha: new Date().toISOString(),
      contenido,
      tipo,
      size: contenido.length
    };

    const newFiles = [...currentFiles, nuevoArchivo];
    // We save files separately if requested, or inside main state. 
    // The prompt requested structure has 'archivos: [...]' inside main object, 
    // AND 'window.storage.set('app:archivos'...)' separately.
    // Let's do BOTH for robustness as requested, but prioritize AppState for consistency.

    // Saving separately as requested
    await storage.set(ARCHIVOS_KEY, JSON.stringify(newFiles));

    return newFiles;
  },

  // Utilidades
  exportar: async () => {
    const res = await storage.get(KEY);
    if (!res) return;
    const blob = new Blob([res.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecclesia-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importar: async (file: File): Promise<AppState | null> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Validaciones básicas
      if (!parsed.people || !parsed.ultimaModificacion) {
        throw new Error("Formato de archivo inválido");
      }

      // IMPORTANTE: Preservar histórico si se desea, o sobrescribir. 
      // Aquí sobrescribimos según lógica de restauración de backup.
      await storage.set(KEY, text);
      return parsed;
    } catch (e) {
      console.error("Error al importar:", e);
      alert("Error al importar: Archivo dañado o formato incorrecto.");
      return null;
    }
  },

  limpiarTodo: async () => {
    if (confirm('¿SEGURO? Se perderá todo el histórico permanentemente.') &&
      confirm('¿REALMENTE SEGURO? Esta acción NO se puede deshacer y borrará todos los datos.')) {
      await storage.delete(KEY);
      await storage.delete(ARCHIVOS_KEY);
      window.location.reload();
    }
  }
};
