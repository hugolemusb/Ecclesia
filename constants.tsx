
import { Church, Person, DemographicStats, SurveyResult, Family, SurveyTemplate, User, Gender, MemberStatus, Question } from './types';

export const MOCK_CHURCH: Church = {
  id: 1,
  name: "IMP Lo Prado",
  address: "Av. San Pablo 5670",
  city: "Lo Prado",
  region: "Metropolitana",
  denomination: "Iglesia Metodista Pentecostal de Chile",
  foundedDate: "1965-05-20",
  pastorPrincipal: "Rev. Daniel Morales",
  claveAdmin: "admin123"
};

const LIKERT_OPTIONS = ["1 - Muy en desacuerdo", "2 - En desacuerdo", "3 - Neutral", "4 - De acuerdo", "5 - Muy de acuerdo"];

const SPIRITUAL_QUESTIONS: Question[] = [
  { id: 1, text: "¿Con qué frecuencia realiza su devocional personal?", type: 'multiple', options: ["Diario", "3-4 veces por semana", "Ocasionalmente", "Casi nunca"], required: true },
  { id: 2, text: "Me siento plenamente integrado en las actividades de mi local.", type: 'likert', options: LIKERT_OPTIONS, required: true },
  { id: 3, text: "¿Está dispuesto a asumir nuevas responsabilidades en su local?", type: 'sino', required: true },
  { id: 4, text: "Considero que mi formación bíblica es suficiente para enseñar a otros.", type: 'likert', options: LIKERT_OPTIONS, required: true },
  { id: 5, text: "¿En qué áreas cree que la iglesia debería mejorar?", type: 'texto', required: false }
];

export const OFFICIAL_MINISTRIES = [
  "Pastores",
  "Iglesia Matriz",
  "Escuela Dominical",
  "Ministerio De Niños",
  "Ministerio De Jóvenes",
  "Ministerio De Alabanza",
  "Ministerio De Acción Social",
  "Ministerio De Consolación",
  "Ministerio De Relaciones Públicas",
  "Ministerio Bíblico"
];

export const MOCK_USERS: User[] = [
  { id: "1", name: "Admin Sistema", nombre: "Admin Sistema", email: "admin@imp.cl", rol: "ADMIN", nickname: "Admin" },
  { id: "2", name: "Pastor Daniel", nombre: "Pastor Daniel", email: "pastor@imp.cl", rol: "PASTOR", nickname: "Pr. Daniel" },
  { id: "3", name: "Hno. Marcos", nombre: "Hno. Marcos", email: "marcos@imp.cl", rol: "LIDER", nickname: "Marcos" },
];

export const MOCK_PEOPLE: Person[] = [
  {
    id: 1,
    name: "Juan Pérez",
    age: 45,
    gender: 'M',
    civilStatus: "Casado", // maritalStatus -> civilStatus
    // roleInFamily: "Padre", // Not in Person interface
    email: "juan@imp.cl",
    phone: "+56912345678",
    address: "Av. San Pablo 1234",
    comuna: "Lo Prado",
    // ciudad: "Santiago", // Not in Person interface
    local: "Iglesia Matriz",
    churchPositions: ["Diácono", "Profesor"],
    position: "Diácono", // Added required field
    baptized: true,
    // memberSince: "2010-01-01", // Not in Person interface
    // conversionDate: "2005-03-15", // Not in Person interface
    // active: true, // Not in Person interface
    status: 'Activo',
    // occupation: "Ingeniero", // Not in Person interface
    ministries: ["Coro", "Ministerio de Varones"],
    // zone: "Zona Norte", // Not in Person interface
    // commitmentScore: 85, // Not in Person interface
    avatar: "https://picsum.photos/seed/juan/200", // photoUrl -> avatar
    createdAt: new Date().toISOString(), // Added required field
    role: "VIEWER" // Added required field
  }
];

export const MOCK_FAMILIES: Family[] = [
  {
    id: 1,
    name: "Familia Pérez",
    address: "Av. San Pablo 1234",
    members: [{ personId: 1, relationship: "JEFE(A) DE HOGAR" }], // Upper case matches expected values often
    notes: "Familia fundadora del local matriz."
    // Removed fields not in Family interface: headOfFamily, headOfFamilyId, iglesiaId
  }
];

export const RELATIONSHIPS = [
  "madre",
  "padre",
  "hijo(a)",
  "hermano(a)",
  "abuelo(a)",
  "primo(a)",
  "cuñado(a)",
  "sobrino(a)",
  "ahijado(a)",
  "tio(a)",
  "jefe(a) de hogar"
];

export const HOUSING_OPTIONS = ['Casa propia', 'Arriendo', 'Allegado'];

export const DEFAULT_CHURCH_POSITIONS = [
  'Pastor', 'Líder', 'Guía', 'Ayudante', 'Profesor', 'Diácono', 'Hermano', 'Mentor'
];

export const DEFAULT_CHURCH_LOCALS = [
  'Iglesia Matriz',
  'Local Apóstol Pedro',
  'Local Luis Pérez H.',
  'La Hermosa'
];

export const DEFAULT_ECCLESIASTICAL_BODIES = [
  'Cuerpo de Diáconos',
  'Cuerpo de Voluntarios',
  'Cuerpo de Dorcas',
  'Cuerpo de Jóvenes',
  'Cuerpo de Ciclistas',
  'Cuerpo de Enfermos'
];

export const DEFAULT_SURVEY_CATEGORIES = [
  { name: 'TRANSICIÓN 2026', includeInStats: true },
  { name: 'NUEVOS MIEMBROS', includeInStats: true },
  { name: 'ADMINISTRATIVO', includeInStats: false },
  { name: 'ESPECIAL', includeInStats: false }
];

export const MOCK_TEMPLATES: SurveyTemplate[] = [
  {
    id: 1, title: "Perfil Espiritual Básico IEP 2025", category: "Básico", description: "Diagnóstico inicial de compromiso y pertenencia eclesial.",
    status: 'active', responses: 1, target: "Toda la hermandad", createdAt: "2024-12-22", questions: SPIRITUAL_QUESTIONS.map(q => { const { category, ...rest } = q as any; return rest; })
  },
  {
    id: 2, title: "Compromiso Comunitario y Pertenencia", category: "Básico", description: "Evalúa integración y disposición al servicio comunitario.",
    status: 'active', responses: 0, target: "Toda la hermandad", createdAt: "2024-12-22", questions: SPIRITUAL_QUESTIONS.map(q => { const { category, ...rest } = q as any; return rest; })
  }
];

export const MOCK_SURVEYS: SurveyResult[] = [
  { area: "Pertenencia", satisfaction: 82, responseCount: 1 },
  { area: "Estado Eclesiástico", satisfaction: 75, responseCount: 1 },
  { area: "Compromiso", satisfaction: 62, responseCount: 1 },
  { area: "Disposición", satisfaction: 88, responseCount: 1 },
];

export const MOCK_STATS: DemographicStats = {
  totalMembers: 1,
  activePercentage: 100,
  totalPeople: 1, totalFamilies: 1, totalMarriages: 1,
  ageDistribution: [{ name: 'Adultos', value: 1 }],
  genderDistribution: [{ name: 'M', value: 1 }],
  ministryDistribution: [{ name: 'Coro', value: 1 }],
  ageStats: { average: 45, median: 45, min: 45, max: 45 }
};

export const CALENDAR_EVENT_TYPES = [
  { value: 'internal', label: 'Interno', color: '#3B82F6' },
  { value: 'corporation', label: 'Corporación', color: '#EF4444' },
  { value: 'sector', label: 'Sector', color: '#10B981' },
  { value: 'communal', label: 'Comunal', color: '#F59E0B' },
  { value: 'sermon', label: 'Sermón', color: '#6366F1' },
  { value: 'study', label: 'Estudio', color: '#8B5CF6' },
  { value: 'other', label: 'Otro', color: '#6B7280' }
];
export const EVENT_ROLES = [
  "Pastor / Ministro",
  "Coordinador General",
  "Coordinador de Piso",
  "Predicador",
  "Director de Alabanza",
  "Coro / Músicos",
  "Protocolo",
  "Bienvenida / Puerta",
  "Seguridad",
  "Aseo y Ornato",
  "Baños",
  "Comedores / Cocina",
  "Vehículos / Estacionamiento",
  "Enfermería / Primeros Auxilios",
  "Audio y Proyección",
  "Comunicación / RRSS",
  "Ayudantes"
];

export const SERVICE_TEMPLATES = {
  DOMINICAL_MATUTINO: {
    type: 'sermon',
    title: 'Culto Dominical Matutino',
    program: [
      { time: '10:00', duration: 10, activity: 'Bienvenida y Avisos' },
      { time: '10:10', duration: 20, activity: 'Alabanza Inicial' },
      { time: '10:30', duration: 5, activity: 'Oración Inicial' },
      { time: '10:35', duration: 15, activity: 'Tiempo de Adoración' },
      { time: '10:50', duration: 10, activity: 'Ofrenda y Diezmo' },
      { time: '11:00', duration: 10, activity: 'Momento Especial' },
      { time: '11:10', duration: 40, activity: 'Predicación' },
      { time: '11:50', duration: 10, activity: 'Llamado y Oración' },
      { time: '12:00', duration: 3, activity: 'Bendición Final' },
      { time: '12:03', duration: 7, activity: 'Despedida' }
    ]
  },
  LITURGIA_ESTANDAR: {
    type: 'sermon',
    title: 'Liturgia Estándar',
    program: [
      { time: '18:00', duration: 10, activity: 'Oración Inicial' },
      { time: '18:10', duration: 20, activity: 'Alabanza General' },
      { time: '18:30', duration: 10, activity: 'Oración de Intercesión' },
      { time: '18:40', duration: 10, activity: 'Alabanza' },
      { time: '18:50', duration: 5, activity: 'Avisos Generales' },
      { time: '18:55', duration: 10, activity: 'Ofrenda / Oración' },
      { time: '19:05', duration: 40, activity: 'Predicación' },
      { time: '19:45', duration: 10, activity: 'Oración por la Palabra' },
      { time: '19:55', duration: 10, activity: 'Alabanza Final' },
      { time: '20:05', duration: 5, activity: 'Palabras del Coordinador' },
      { time: '20:10', duration: 10, activity: 'Oración por los Enfermos' },
      { time: '20:20', duration: 5, activity: 'Bendición Final' }
    ]
  },
  REUNION_ORACION: {
    type: 'internal',
    title: 'Reunión de Oración',
    program: [
      { time: '20:00', duration: 10, activity: 'Introducción y Peticiones' },
      { time: '20:10', duration: 10, activity: 'Alabanza Breve' },
      { time: '20:20', duration: 10, activity: 'Palabra de Motivación' },
      { time: '20:30', duration: 25, activity: 'Oración en Grupos' },
      { time: '20:55', duration: 5, activity: 'Oración Final' }
    ]
  },
  ESTUDIO_BIBLICO: {
    title: 'Estudio Bíblico',
    type: 'study',
    program: [
      { time: '19:30', duration: 15, activity: 'Oración Inicial y Alabanzas' },
      { time: '19:45', duration: 45, activity: 'Estudio de la Palabra' },
      { time: '20:30', duration: 15, activity: 'Preguntas y Comentarios' },
      { time: '20:45', duration: 10, activity: 'Oración Final y Despedida' }
    ]
  },
  SERVICIO_JUEVES: {
    title: 'Culto General de Jueves',
    type: 'sermon',
    program: [
      { time: '19:30', duration: 15, activity: 'Invocación y Bienvenida' },
      { time: '19:45', duration: 20, activity: 'Alabanzas Congregacionales' },
      { time: '20:05', duration: 10, activity: 'Lectura Bíblica' },
      { time: '20:15', duration: 30, activity: 'Predicación' },
      { time: '20:45', duration: 10, activity: 'Oración por Necesidades' },
      { time: '20:55', duration: 5, activity: 'Anuncios y Ofrenda' }
    ]
  },
  ACCION_DE_GRACIAS: {
    title: 'Culto de Acción de Gracias',
    type: 'sermon',
    program: [
      { time: '10:00', duration: 20, activity: 'Alabanza de Júbilo' },
      { time: '10:20', duration: 30, activity: 'Oportunidades de Gratitud' },
      { time: '10:50', duration: 10, activity: 'Ofrenda Especial' },
      { time: '11:00', duration: 40, activity: 'Mensaje de Gratitud' },
      { time: '11:40', duration: 10, activity: 'Oración Final' }
    ]
  },
  SANTA_CENA: {
    title: 'Culto de Santa Cena',
    type: 'sermon',
    program: [
      { time: '18:00', duration: 20, activity: 'Alabanza y Adoración' },
      { time: '18:20', duration: 10, activity: 'Lectura de 1 Corintios 11' },
      { time: '18:30', duration: 30, activity: 'Predicación Solemne' },
      { time: '19:00', duration: 15, activity: 'Repartición del Pan' },
      { time: '19:15', duration: 15, activity: 'Repartición de la Copa' },
      { time: '19:30', duration: 10, activity: 'Oración de Consagración' },
      { time: '19:40', duration: 10, activity: 'Himno Final' }
    ]
  }
};
