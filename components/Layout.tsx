import React, { useState } from 'react';
import { LayoutProps } from '../types';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './ui/Breadcrumbs';

const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
  currentUser,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Alias for legacy components expecting activeTab
  const activeTab = currentView;
  const setActiveTab = (tab: string) => onNavigate(tab as any);

  // Mapping tab IDs to human-readable titles for the Header
  const getPageTitle = (tabId: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard Pastoral',
      'members': 'Gestión de Hermandad',
      'families': 'Grupos Familiares',
      'surveys': 'Encuestas y Sondeos',
      'community': 'Entorno Social y Mapa',
      'analysis': 'Análisis Inteligente (IA)',
      'settings': 'Configuración del Sistema'
    };
    return titles[tabId] || 'Ecclesia Insights';
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans">
      {/* Sidebar - Hidden on mobile unless toggled, fixed on desktop */}
      <div className={`fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />

      <div className={`fixed lg:sticky top-0 h-screen z-50 transform lg:transform-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          currentUser={currentUser}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-0">
        <Header
          title={getPageTitle(activeTab)}
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="p-4 sm:p-6 lg:p-10 max-w-[1920px] mx-auto w-full animate-in fade-in duration-500">
          <Breadcrumbs
            items={[
              { label: 'Ecclesia', onClick: () => setActiveTab('dashboard') },
              ...(activeTab !== 'dashboard' ? [{ label: getPageTitle(activeTab) }] : [])
            ]}
          />
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
