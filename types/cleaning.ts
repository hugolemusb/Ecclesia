export interface CleaningGroup {
  id: number;
  name: string;
  coordinator: string;
  members: string[];
  phone: string;
  keyHolder: string;
  preferredTime: string;
}

export interface ChurchService {
  id: number;
  name: string;
  day: 'Domingo' | 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  time: string;
  requiresCleaning: boolean;
}

export interface CleaningScheduleItem {
  id: string;
  date: string;
  day: string;
  service: string;
  serviceTime: string;
  group: CleaningGroup;
  weekNumber: number;
  absence: Absence | null;
}

export type AbsenceType = 'vacation' | 'permission' | 'sick' | 'emergency';

export interface Absence {
  id: number;
  scheduleId: string;
  scheduleDate: string;
  originalGroupId: number;
  originalGroupName: string;
  reason: string;
  type: AbsenceType;
  replacementGroup: CleaningGroup | null;
  replacementMembers: string[];
  notes: string;
  createdAt: string;
}

export interface UrgentCleaning {
  id: string;
  date: string;
  time: string;
  reason: string;
  assignedGroup: CleaningGroup;
  details: string;
  type: 'urgent';
  createdAt: Date;
}

export interface CleaningExportConfig {
  churchName: string;
  address: string;
  phone: string;
  email: string;
  pastor: string;
  includeHeader: boolean;
  includeFooter: boolean;
  additionalNotes: string;
}

export interface BibleVerse {
  text: string;
  reference: string;
}

export type ViewMode = 'weekly' | 'monthly';
export type ExportFormat = 'txt' | 'pdf' | 'word';
