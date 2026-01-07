import { ServiceTemplate, ServiceType } from '../types/services';

export const DEFAULT_SERVICE_TEMPLATES: ServiceTemplate[] = [
    {
        id: 'template-domingo-am',
        name: 'Culto Domingo Mañana',
        type: 'culto-dominical-am',
        tags: ['culto', 'regular', 'domingo'],
        color: '#4A90E2',
        icon: 'Sun',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-domingo-pm',
        name: 'Culto Domingo Tarde',
        type: 'culto-dominical-pm',
        tags: ['culto', 'regular', 'domingo'],
        color: '#7B68EE',
        icon: 'Sunset',
        defaultDuration: 90,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-oracion',
        name: 'Culto de Oración (Miércoles)',
        type: 'oracion-miercoles',
        tags: ['culto', 'regular', 'oracion'],
        color: '#9B59B6',
        icon: 'Church',
        defaultDuration: 90,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-escuela',
        name: 'Escuela Dominical',
        type: 'escuela-dominical',
        tags: ['ministerio', 'regular', 'educacion'],
        color: '#27AE60',
        icon: 'BookOpen',
        defaultDuration: 60,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-jovenes',
        name: 'Reunión de Jóvenes',
        type: 'jovenes',
        tags: ['ministerio', 'juventud'],
        color: '#F39C12',
        icon: 'Users',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-damas',
        name: 'Reunión de Damas',
        type: 'damas',
        tags: ['ministerio', 'mujeres'],
        color: '#E91E63',
        icon: 'Heart',
        defaultDuration: 90,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-varones',
        name: 'Reunión de Varones',
        type: 'varones',
        tags: ['ministerio', 'hombres'],
        color: '#3498DB',
        icon: 'Shield',
        defaultDuration: 90,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-dia-madre',
        name: 'Día de la Madre',
        type: 'dia-madre',
        tags: ['especial', 'celebracion', 'familia'],
        color: '#E74C3C',
        icon: 'Flower',
        defaultDuration: 150,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-dia-padre',
        name: 'Día del Padre',
        type: 'dia-padre',
        tags: ['especial', 'celebracion', 'familia'],
        color: '#34495E',
        icon: 'Award',
        defaultDuration: 150,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-dia-nino',
        name: 'Día del Niño',
        type: 'dia-nino',
        tags: ['especial', 'celebracion', 'ninos'],
        color: '#F1C40F',
        icon: 'Baby',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-cumple-pastor',
        name: 'Cumpleaños de Pastor',
        type: 'cumple-pastor',
        tags: ['especial', 'celebracion', 'pastoral'],
        color: '#8E44AD',
        icon: 'Gift',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-cumple-pastora',
        name: 'Cumpleaños de Pastora',
        type: 'cumple-pastora',
        tags: ['especial', 'celebracion', 'pastoral'],
        color: '#C0392B',
        icon: 'Gift',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-aniversario',
        name: 'Aniversario de la Iglesia',
        type: 'aniversario-iglesia',
        tags: ['especial', 'celebracion', 'aniversario'],
        color: '#D35400',
        icon: 'PartyPopper',
        defaultDuration: 180,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-media-vigilia',
        name: 'Media Vigilia',
        type: 'media-vigilia',
        tags: ['vigilia', 'oracion'],
        color: '#16A085',
        icon: 'Moon',
        defaultDuration: 180,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-vigilia-completa',
        name: 'Vigilia Completa',
        type: 'vigilia-completa',
        tags: ['vigilia', 'oracion'],
        color: '#2C3E50',
        icon: 'MoonStar',
        defaultDuration: 420,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-accion-gracias',
        name: 'Acción de Gracias',
        type: 'accion-gracias',
        tags: ['especial', 'celebracion', 'gratitud'],
        color: '#E67E22',
        icon: 'HandHeart',
        defaultDuration: 150,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-tedeum',
        name: 'Tedeum',
        type: 'tedeum',
        tags: ['especial', 'celebracion', 'nacional'],
        color: '#34495E',
        icon: 'Flag',
        defaultDuration: 90,
        isDefault: true,
        fields: []
    },
    {
        id: 'template-evento-especial',
        name: 'Evento Especial',
        type: 'evento-especial',
        tags: ['especial'],
        color: '#95A5A6',
        icon: 'Sparkles',
        defaultDuration: 120,
        isDefault: true,
        fields: []
    }
];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    'culto-dominical-am': 'Culto Domingo AM',
    'culto-dominical-pm': 'Culto Domingo PM',
    'oracion-miercoles': 'Culto de Oración',
    'escuela-dominical': 'Escuela Dominical',
    'jovenes': 'Jóvenes',
    'damas': 'Damas',
    'varones': 'Varones',
    'dia-madre': 'Día de la Madre',
    'dia-padre': 'Día del Padre',
    'dia-nino': 'Día del Niño',
    'cumple-pastor': 'Cumpleaños de Pastor',
    'cumple-pastora': 'Cumpleaños de Pastora',
    'aniversario-iglesia': 'Aniversario de la Iglesia',
    'media-vigilia': 'Media Vigilia',
    'vigilia-completa': 'Vigilia Completa',
    'accion-gracias': 'Acción de Gracias',
    'tedeum': 'Tedeum',
    'evento-especial': 'Evento Especial',
    'otro': 'Otro'
};
