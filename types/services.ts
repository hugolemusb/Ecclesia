export type ServiceType =
    | 'culto-dominical-am'
    | 'culto-dominical-pm'
    | 'oracion-miercoles'
    | 'escuela-dominical'
    | 'jovenes'
    | 'damas'
    | 'varones'
    | 'dia-madre'
    | 'dia-padre'
    | 'dia-nino'
    | 'cumple-pastor'
    | 'cumple-pastora'
    | 'aniversario-iglesia'
    | 'media-vigilia'
    | 'vigilia-completa'
    | 'accion-gracias'
    | 'tedeum'
    | 'evento-especial'
    | 'otro';

export type ServiceStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ServiceField {
    id: string;
    label: string;
    type: 'text' | 'richtext' | 'member' | 'members' | 'songs' | 'scripture' | 'textarea';
    required: boolean;
    defaultValue?: any;
}

export interface ServiceTemplate {
    id: string;
    name: string;
    type: ServiceType;
    tags: string[];
    color: string; // for visual identification
    icon: string; // lucide icon name
    defaultDuration: number; // in minutes
    fields: ServiceField[];
    isDefault: boolean; // predefined vs custom
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Song {
    id: string;
    name: string;
    artist: string;
    key: string; // musical key (C, D, etc.)
    duration: number; // in minutes
}

export interface ScriptureReference {
    book: string;
    chapter: number;
    versesStart: number;
    versesEnd?: number;
    text?: string; // optional cached text
}

export interface Announcement {
    id: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
    responsible: string;
}

export interface ProgramSection {
    id: string;
    type: 'worship' | 'liturgy' | 'assignments' | 'announcements' | 'offerings' | 'special' | 'notes';
    data: any; // specific to section type
}

export interface WorshipSectionData {
    leader: string;
    groupName?: string;
    songs: Song[];
}

export interface LiturgySectionData {
    scriptureReading: ScriptureReference;
    prayerOpening: string; // responsible person
    prayerClosing: string;
    sermonTheme: string;
    keyVerse: string;
}

export interface AssignmentsSectionData {
    ushers: string[];
    sound: string;
    multimedia: string;
    streaming: string;
    nursery: string;
    parking: string;
    others: { role: string; person: string }[];
}

export interface AnnouncementsSectionData {
    announcements: Announcement[];
}

export interface OfferingsSectionData {
    type: string;
    purpose: string;
    collectors: string[];
}

export interface SpecialActivitiesSectionData {
    baptisms: string[]; // names of candidates
    childDedications: string[];
    holyCommunion: boolean;
    specialCeremonies: string[];
    testimonies: string[];
}

export interface ServiceProgram {
    id: string;
    templateId: string;
    date: Date;
    time: string; // HH:MM format
    title: string;
    minister: string; // main minister/preacher
    status: ServiceStatus;
    sections: ProgramSection[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    version: number; // for version tracking
}

export interface ServiceFolder {
    id: string;
    name: string;
    type: 'auto' | 'custom'; // auto-generated vs user-created
    filter?: ServiceFilter; // for auto folders
    color?: string;
    icon?: string;
}

export interface ServiceFilter {
    dateRange?: { start: Date; end: Date };
    types?: ServiceType[];
    ministers?: string[];
    statuses?: ServiceStatus[];
    searchText?: string;
}
