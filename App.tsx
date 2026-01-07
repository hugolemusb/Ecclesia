

import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import Layout from './components/Layout';
import { SermonEditor } from './components/SermonEditor';
import Dashboard from './components/features/Dashboard';
import { BibleSearch } from './components/BibleSearch';
import { BibleReader } from './components/BibleReader';
import { LibraryManager } from './components/LibraryManager';
import {
  OFFICIAL_MINISTRIES,
  DEFAULT_CHURCH_POSITIONS,
  DEFAULT_CHURCH_LOCALS,
  DEFAULT_ECCLESIASTICAL_BODIES
} from './constants';
import CalendarView from './components/features/calendar/CalendarView';
import Login from './components/features/Login';
import { Teleprompter } from './components/Teleprompter';
import { InfografiaSermon } from './components/InfografiaSermon';

import { MemberManager } from './components/features/MemberManager';
import FamilyManager from './components/features/FamilyManager';
import SurveyManager from './components/features/SurveyManager';
import Settings from './components/features/Settings';
import { ServicesManager } from './components/features/services/ServicesManager';import { Theme, ViewState, UserProfile, TimerState, TextSettings, AuthState } from './types';
import { CleaningManager } from './components/features/cleaning/CleaningManager';

// Mock User Profile - Fallback seguro
const USER_PROFILE: UserProfile = {
  id: '1',
  name: 'Pastor Principal', // Fallback legacy
  nombre: 'Pastor Principal', // Required by Sidebar/Header
  email: 'pastor@imp.cl',
  nickname: 'Pastor',
  rol: 'ADMIN' // Required by Sidebar
};

function AppContent() {
  const { setLanguage } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    lockedLanguage: null
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILE); // Add user state

  const [theme, setTheme] = useState<Theme>('day');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('user_avatar') || '');

  // Text Settings State
  const [textSettings, setTextSettings] = useState<TextSettings>({
    fontSize: 18,
    lineHeight: 1.6,
    maxWidth: 100
  });

  // --- DATA STATE ---
  const [people, setPeople] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [surveyTemplates, setSurveyTemplates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]); // Added events state
  const [appConfig, setAppConfig] = useState<any>({
    ministries: OFFICIAL_MINISTRIES,
    housingStatuses: ['Casa propia', 'Arriendo', 'Allegado'], // Keep explicit or import if available
    familyRelationships: ['JEFE(A) DE HOGAR', 'ESPOSO(A)', 'HIJO(A)', 'PADRE/MADRE', 'HERMANO(A)', 'OTRO'],
    surveyCategories: [],
    churchLocals: DEFAULT_CHURCH_LOCALS,
    churchPositions: DEFAULT_CHURCH_POSITIONS,
    ecclesiasticalBodies: DEFAULT_ECCLESIASTICAL_BODIES
  });

  // Check session and LOAD DATA on mount
  useEffect(() => {
    const lockedLang = sessionStorage.getItem('LOCKED_LANGUAGE');
    if (lockedLang) {
      setAuthState({ isAuthenticated: true, lockedLanguage: lockedLang as any });
      setLanguage(lockedLang as any); // Sync context
    }

    // Load Data from DB
    import('./db').then(({ db }) => {
      db.loadAll().then(data => {
        if (data) {
          setPeople(data.people || []);
          setFamilies(data.families || []);
          setSurveyResponses(data.surveyResponses || []);
          setSurveyTemplates(data.surveyTemplates || []);
          setEvents(data.events || []); // Load events
          // Merge config if exists, else keep defaults
          // Merge config if exists, else keep defaults
          if (data.configuracion) {
            setAppConfig(prev => ({
              ...prev,
              ...data.configuracion,
              // Setup fallback for critical lists if they are empty in DB
              ministries: (data.configuracion.ministries && data.configuracion.ministries.length > 0) ? data.configuracion.ministries : OFFICIAL_MINISTRIES,
              churchLocals: (data.configuracion.churchLocals && data.configuracion.churchLocals.length > 0) ? data.configuracion.churchLocals : DEFAULT_CHURCH_LOCALS,
              // ... other overrides if needed, but usually we want to trust DB if it has data. 
              // However, user specifically asked for "Pastores" etc which are in constants.
              // If we want constants to ALWAYS win on startup for updates:
              // But that would overwrite user customizations.
              // Strategy: If DB has data, use it. If not, use constants. 
              // The previous code FORCED constants. Let's respect DB but ensure keys exist.
            }));
          }
        }
      });
    });
  }, []);

  // Save on changes (Debounced ideally, but here simple effect)
  useEffect(() => {
    if (people.length > 0) {
      import('./db').then(({ db }) => {
        db.saveAll({
          people, families, surveyResponses, surveyTemplates,
          configuracion: appConfig,
          historico: [],
          archivos: [],
          dismissedNoticeIds: [],
          events: [],
          ultimaModificacion: new Date().toISOString()
        } as any);
      });
    }
  }, [people, families, surveyResponses, surveyTemplates, appConfig]);


  const handleLogin = (user?: any) => {
    const lockedLang = sessionStorage.getItem('LOCKED_LANGUAGE');
    setAuthState({
      isAuthenticated: true,
      lockedLanguage: lockedLang ? (lockedLang as any) : null
    });
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('LOCKED_LANGUAGE');
    setAuthState({ isAuthenticated: false, lockedLanguage: null });
    // Limpiar caché de búsquedas al salir del sistema
    localStorage.removeItem('last_study_session');
    localStorage.removeItem('bible_reader_state');
    // Reload page to clear any other potential memory states
    window.location.reload();
  };

  const handleUpdateAvatar = (url: string) => {
    setUserAvatar(url);
    localStorage.setItem('user_avatar', url);
  };

  // Global Timer State
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeLeft: 0,
    totalDuration: 0
  });

  useEffect(() => {
    let interval: any;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setTimerState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = (newDuration: number) => {
    setTimerState({
      isRunning: false,
      timeLeft: newDuration,
      totalDuration: newDuration
    });
  };

  const resetTimerOnly = () => {
    setTimerState(prev => ({
      isRunning: false,
      timeLeft: prev.totalDuration,
      totalDuration: prev.totalDuration
    }));
  };

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'night') return 'day';
      if (prev === 'day') return 'sepia';
      if (prev === 'sepia') return 'forest';
      if (prev === 'forest') return 'ocean';
      return 'night';
    });
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          people={people}
          responses={surveyResponses}
          templates={surveyTemplates}
          events={events}
          setActiveTab={(tab) => handleNavigate(tab as ViewState)}
          config={appConfig}
        />;
      case 'search':
        return <BibleSearch textSettings={textSettings} onNavigate={handleNavigate} />;
      case 'bible':
        return <BibleReader textSettings={textSettings} onNavigate={handleNavigate} />;
      case 'library':
        return <LibraryManager textSettings={textSettings} />;
      case 'calendar':
        return <CalendarView />;
      case 'editor':
        return <SermonEditor
          theme={theme}
          timerState={timerState}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          onResetTimerOnly={resetTimerOnly}
          textSettings={textSettings}
          onOpenTeleprompter={() => handleNavigate('teleprompter')}
        />;
      case 'teleprompter':
        const teleprompterType = (localStorage.getItem('teleprompter_content_type') || 'sermon') as 'sermon' | 'study' | 'dictionary';
        return <Teleprompter onBack={() => handleNavigate('editor')} contentType={teleprompterType} />;
      case 'infografia':
        return <InfografiaSermon />;
      case 'members':
        return <MemberManager
          role="ADMIN"
          people={people}
          setPeople={setPeople}
          onDelete={(id) => setPeople(prev => prev.filter(p => p.id !== id))}
          templates={surveyTemplates}
          responses={surveyResponses}
          setResponses={setSurveyResponses}
          appConfig={appConfig}
          families={families}
          setFamilies={setFamilies}
        />;
      case 'families':
        return <FamilyManager
          families={families}
          setFamilies={setFamilies}
          people={people}
          appConfig={appConfig}
          onDelete={(id) => setFamilies(prev => prev.filter(f => f.id !== id))}
        />;
      case 'surveys':
        return <SurveyManager
          role="ADMIN"
          templates={surveyTemplates}
          setTemplates={setSurveyTemplates}
          people={people}
          setResponses={setSurveyResponses}
          setPeople={setPeople}
          config={appConfig}
          setConfig={setAppConfig}
        />;
      case 'services-management':
        return <ServicesManager />;
      
      case 'cleaning-management':
        return <CleaningManager />;case 'settings':
        return <Settings
          role={currentUser?.rol || 'ADMIN'}
          appConfig={appConfig}
          setAppConfig={setAppConfig}
          // Pass data for migration
          people={people}
          families={families}
          events={events}

          onClearAll={async () => {
            if (confirm("¿Borrar todo los datos locales?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          onExport={async () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ people, families, surveyResponses, surveyTemplates, configuracion: appConfig, events }));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
          onImport={async (file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const text = e.target?.result;
              if (typeof text === 'string') {
                const data = JSON.parse(text);
                if (data.people) setPeople(data.people);
                if (data.families) setFamilies(data.families);
                if (data.events) setEvents(data.events);
                if (data.configuracion) setAppConfig(data.configuracion);
                alert("Importación exitosa. Recargue la página si es necesario.");
              }
            };
            reader.readAsText(file);
          }}
          onRestoreFromCloud={async () => {
            alert("Función de nube no configurada en esta versión local.");
          }}
        />;
      case 'community':
        return <div className="p-10 text-center"><h1>Entorno Social (En Desarrollo)</h1></div>;
      case 'analysis':
        return <div className="p-10 text-center"><h1>Análisis IA (En Desarrollo)</h1></div>;
      default:
        return <Dashboard
          userProfile={{ ...USER_PROFILE, avatar: userAvatar }}
          username={USER_PROFILE.name}
          onNavigate={handleNavigate}
          textSettings={textSettings}
        />;
    }
  };

  if (!authState.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Teleprompter has its own layout (fullscreen/distraction free)
  if (currentView === 'teleprompter') {
    return renderView();
  }

  return (
    <Layout
      theme={theme}
      currentView={currentView}
      onNavigate={handleNavigate}
      onToggleTheme={toggleTheme}
      textSettings={textSettings}
      onUpdateTextSettings={setTextSettings}
      onLogout={handleLogout}
      userAvatar={userAvatar}
      onUpdateAvatar={handleUpdateAvatar}
      currentUser={currentUser}
    >
      <div className="h-full w-full overflow-y-auto bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {renderView()}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
