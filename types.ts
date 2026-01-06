
import React from 'react';

export type Theme = 'night' | 'day' | 'sepia' | 'forest' | 'ocean';

// --- I18N TYPES ---
export type Language = 'es' | 'en' | 'pt';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLocked: boolean;
}

export interface TextSettings {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
}

export enum SectionType {
  LECTURA = 'LECTURA',
  DESARROLLO = 'DESARROLLO',
  LLAMADO = 'LLAMADO',
  CIERRE = 'CIERRE',
  EXTRA = 'EXTRA'
}

export interface SermonSection {
  id: string;
  type: SectionType;
  title: string;
  durationMin: number;
  content: string;
  baseVerse?: string;
}

export interface MarginNote {
  id: string;
  sectionId: string;
  selectedText: string;
  noteText: string;
  searchQuery?: string;
  createdAt: number;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  location?: string;
  address?: string;
  ministryId?: string;
  theme?: string; // Tema/palabra clave para enfocar el sermón
  category?: string; // Categoría para organizar y filtrar sermones
  mainVerse: string;
  mainVerseVersion?: string;
  mainVerseText?: string;
  infographicData?: {
    sections: any;
    extractedInfo: any;
    powerPhrases: any; // PowerPhrasesResult
    isGenerated: boolean;
    lastExtractedContent: string;
  };
  sections: SermonSection[];
  marginNotes?: MarginNote[];
  bibleNotes?: string;
  announcements?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'wiki';
  content: string;
  timestamp: number;
}

export enum Emotion {
  JOY = 'Gozo',
  NEUTRAL = 'Calma',
  ANXIETY = 'Ansiedad',
  SADNESS = 'Tristeza',
  ANGER = 'Ira'
}

export interface UserProfile {
  id: string;
  name: string;
  nombre?: string; // Compatibility
  email: string;
  avatar?: string;
  nickname?: string;
  rol?: string; // Compatibility for Sidebar
}

export type User = UserProfile;

export interface AuthState {
  isAuthenticated: boolean;
  lockedLanguage: Language | null;
}

export interface Project {
  id: number | string;
  title: string;
  date: string;
  status: string;
}

export interface SearchResult {
  verses: {
    ref: string;
    version: string;
    text: string;
    tags?: string[];
  }[];
  insight: {
    title: string;
    psychologicalConcept: string;
    content: string;
  };
}

export interface DictionaryResult {
  term: string;
  originalWord: string;
  language: 'Hebreo' | 'Griego' | 'Arameo' | 'Latín';
  phonetic: string;
  definition: string;
  theologicalSignificance: string;
  biblicalReferences: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'internal' | 'corporation' | 'sector' | 'communal' | 'sermon' | 'study' | 'other'; // Enhanced types
  startDate: string; // ISO date format YYYY-MM-DDTHH:mm
  endDate: string;   // ISO date format YYYY-MM-DDTHH:mm
  location?: string;
  address?: string;
  responsibleId?: number; // Leader in charge
  assignedPeopleIds?: number[]; // Members assigned
  isVirtual?: boolean;

  // Customization
  color?: string; // Hex color override

  // Content
  notes?: string;
  attachments?: { id: string; name: string; url: string; type: string }[];

  // Logic
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reminders?: number[]; // Hours before event

  // Recurrence
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    daysOfWeek?: number[]; // 0-6 for weekly
    interval?: number; // Every X weeks/months
    endDate?: string;
  };

  // Legacy fields compatibility (optional)
  date?: string;
  time?: string;
  endTime?: string;

  createdAt: number;
  updatedAt: number;

  // --- APPROVED EXTENSIONS FOR SERVICE PLANNING ---
  ministryId?: string; // One of the 5 official ministries
  localId?: string; // One of the 4 locals OR 'External'
  program?: ServiceProgramItem[];
  assignments?: Record<string, string[]>; // Role -> Array of Names
  logistics?: LogisticsRequirements;
  observations?: string;
  approvalStatus?: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
}

export interface ServiceProgramItem {
  id: string;
  time: string; // "10:00"
  duration: number; // minutes
  activity: string; // "Alabanza", "Predicación"
  responsibleName?: string;
  responsibleId?: number; // Link to Person
  notes?: string;
}

export interface ResourceRequest {
  resourceId: string; // "Proyector", "Sillas"
  quantity: number;
  status: 'Pending' | 'Approved' | 'Denied';
}

export interface LogisticsRequirements {
  setupTeamIds?: number[]; // People IDs
  resources?: ResourceRequest[]; // or string[] in local state, strict typing might be needed
  customResources?: string[]; // New: for custom added resources
  keysRequired?: boolean;
  keyPickupPerson1?: string;
  keyPickupPerson2?: string;
  cleanUpRequired?: boolean;
}

export type StorageType = 'local' | 'onedrive' | 'gdrive' | 'icloud';

export interface StorageConfig {
  type: StorageType;
  isConnected: boolean;
  email?: string;
  lastSync?: number;
}

export interface GoogleCalendarConfig {
  isConnected: boolean;
  email?: string;
  calendarId?: string;
  syncEnabled: boolean;
}

export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  totalDuration: number;
}

export type ViewState = 'dashboard' | 'search' | 'editor' | 'bible' | 'library' | 'teleprompter' | 'calendar' | 'infografia' | 'members' | 'families' | 'surveys' | 'community' | 'analysis' | 'settings';

export type AIProvider = 'gemini' | 'external';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelId?: string;
  friendlyName?: string;
  useCorsProxy?: boolean;
}

export interface LayoutProps {
  children: React.ReactNode;
  theme: Theme;
  onToggleTheme: () => void;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  textSettings: TextSettings;
  onUpdateTextSettings: (settings: TextSettings) => void;
  onLogout: () => void;
  userAvatar?: string;
  onUpdateAvatar: (url: string) => void;
}

// --- LIBRARY TYPES ---
export type TheologicalTradition = 'Bautista' | 'Metodista' | 'Pentecostal' | 'Reformada' | 'Católica' | 'General';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string; // Can be a placeholder color or image
  tradition: TheologicalTradition;
  category: string; // e.g., "Sistemática", "Comentario"
  content: string; // The full OCR text
  addedAt: number;
  isFavorite: boolean;
  tags: string[];
  fileName?: string; // Original filename for display
}

export interface SavedQuote {
  id: string;
  text: string;
  bookId: string;
  bookTitle: string;
  author: string;
  page?: number;
  createdAt: number;
  tags: string[];
}

// --- APP DATA TYPES ---

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export type ChurchLocal = 'SANTIAGO' | 'VALPARAÍSO' | 'CONCEPCIÓN' | 'OTHER' | 'Iglesia Matriz' | 'Apóstol Pedro' | 'Luis Pérez' | 'La Hermosa' | 'Ninguno' | 'Local Apóstol Pedro' | 'Local Luis Pérez H.';

export type ChurchPosition = 'PASTOR' | 'ANCIANO' | 'DIÁCONO' | 'LÍDER' | 'MIEMBRO' | 'VISITA' | 'Pastor' | 'Líder' | 'Guía' | 'Ayudante' | 'Profesor' | 'Diácono' | 'Hermano';

export type MemberStatus = 'Activo' | 'Seguimiento' | 'Detenido' | 'Inactivo';

export type Gender = 'M' | 'F';

export interface Person {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender: Gender;
  civilStatus?: string;
  profession?: string;
  baptized?: boolean;
  role: UserRole;
  local: ChurchLocal;
  locals?: string[];
  position: ChurchPosition;
  status: MemberStatus;
  ministries: string[];
  familyId?: number;
  notes?: string;
  avatar?: string;
  // Mentorship
  // Mentorship
  isMentorExternal?: boolean;
  assignedMentorId?: number;
  assignedMentorName?: string;
  // Leadership
  isLeader?: boolean;
  leadershipRoles?: string[]; // e.g. ["Mentor", "Líder de Jóvenes"]
  // Metadata
  housingStatus?: string;
  createdAt: string;
  // Extended fields
  childrenList?: any[];
  age?: number;
  comuna?: string;
  mentorshipAssignments?: any[];
  churchPositions?: any[];
  evaluations?: any[];
}

export interface FamilyMemberRef {
  personId: number;
  relationship: string; // 'HEAD', 'SPOUSE', 'CHILD', 'OTHER'
}

export interface Family {
  id: number;
  name: string; // e.g., "Familia Pérez González"
  address?: string; // Main address
  members: FamilyMemberRef[];
  notes?: string;
}

export interface Question {
  id: number;
  text: string;
  type: 'text' | 'number' | 'rating' | 'boolean' | 'select' | 'checkbox' | 'multiple' | 'sino' | 'likert' | 'texto'; // Expanded types
  options?: string[]; // For select/checkbox
  required?: boolean;
}

export interface SurveyTemplate {
  id: number;
  title: string;
  name?: string; // Add alias for compat
  description?: string;
  category: string;
  target?: string;
  status?: 'active' | 'draft' | 'closed';
  questions: Question[];
  createdAt: string;
  responses?: number;
}

export interface Answer {
  questionId: number;
  value: string | number | string[];
}

export interface DemographicStats {
  totalMembers: number;
  activePercentage: number;
  growthRate?: number;
  attendanceAvg?: number;
  [key: string]: any;
}

export interface SurveyResponse {
  id: number;
  templateId: number;
  personId: number; // respondent
  date: string;
  answers: Answer[]; // Changed from Record to Array
  score?: number; // Calculated score if applicable
  updatedAt?: string;
}

export interface AppConfig {
  ministries: string[];
  housingStatuses: string[];
  familyRelationships: string[];
  surveyCategories: string[];
  churchLocals: string[];
  churchPositions: string[];
  ecclesiasticalBodies: string[];
}

export interface AppState {
  people: Person[];
  families: Family[];
  events: CalendarEvent[];
  surveyTemplates: SurveyTemplate[];
  surveyResponses: SurveyResponse[];
  configuracion: any; // Using any for flexibility with appConfig merging
  historico: any[];
  archivos: any[];
  dismissedNoticeIds: string[];
  ultimaModificacion: string;
}

// --- MISSING TYPES FOR CONSTANTS.TSX ---

export interface Church {
  id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  denomination: string;
  foundedDate: string;
  pastorPrincipal: string;
  claveAdmin: string;
}

export interface SurveyResult {
  area: string;
  satisfaction: number;
  responseCount: number;
}
