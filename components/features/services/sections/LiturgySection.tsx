import React, { useState } from 'react';
import { Book, Search, User } from 'lucide-react';
import { ScriptureReference } from '../../../../types/services';

interface LiturgySectionProps {
  scripture: ScriptureReference;
  prayerOpening: string;
  prayerClosing: string;
  minister: string;
  sermonTheme: string;
  sermonType: string;
  keyVerse: string;
  onChange: (data: {
    scripture: ScriptureReference;
    prayerOpening: string;
    prayerClosing: string;
    minister: string;
    sermonTheme: string;
    sermonType: string;
    keyVerse: string;
  }) => void;
}

const BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
  'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes',
  '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester',
  'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares',
  'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel',
  'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm',
  'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan',
  'Hechos', 'Romanos', '1 Corintios', '2 Corintios',
  'Gálatas', 'Efesios', 'Filipenses', 'Colosenses',
  '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo',
  'Tito', 'Filemón', 'Hebreos', 'Santiago',
  '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis'
];

const SERMON_TYPES = [
  'Sermón',
  'Devocional',
  'Estudio Bíblico',
  'Predicación Evangelística',
  'Enseñanza Temática'
];

export const LiturgySection: React.FC<LiturgySectionProps> = ({
  scripture,
  prayerOpening,
  prayerClosing,
  minister,
  sermonTheme,
  sermonType,
  keyVerse,
  onChange
}) => {
  const [verseText, setVerseText] = useState('');
  const [loading, setLoading] = useState(false);

  const getMembers = () => {
    const saved = localStorage.getItem('serviceMembers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  };

  const members = getMembers();

  const fetchVerse = async () => {
    if (!scripture.book || !scripture.chapter || !scripture.versesStart) {
      alert('Por favor completa libro, capítulo y versículos');
      return;
    }

    setLoading(true);
    try {
      const verseRange = scripture.versesEnd 
        ? `${scripture.versesStart}-${scripture.versesEnd}`
        : scripture.versesStart.toString();
      
      const response = await fetch(
        `https://bible-api.com/${scripture.book}+${scripture.chapter}:${verseRange}?translation=RVR1960`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVerseText(data.text || 'Versículo no encontrado');
      } else {
        setVerseText('Error al cargar el versículo. Verifica la referencia.');
      }
    } catch (error) {
      setVerseText('Error de conexión. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scripture Reading */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Book size={20} />
          Lectura Bíblica
        </h3>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Libro</label>
            <select
              value={scripture.book}
              onChange={(e) => onChange({ scripture: { ...scripture, book: e.target.value }, prayerOpening, prayerClosing, minister, sermonTheme, sermonType, keyVerse })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar...</option>
              {BOOKS.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Capítulo</label>
            <input
              type="number"
              min="1"
              value={scripture.chapter || ''}
              onChange={(e) => onChange({ scripture: { ...scripture, chapter: parseInt(e.target.value) || 0 }, prayerOpening, prayerClosing, minister, sermonTheme, sermonType, keyVerse })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="#"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Versículos</label>
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                value={scripture.versesStart || ''}
                onChange={(e) => onChange({ scripture: { ...scripture, versesStart: parseInt(e.target.value) || 0 }, prayerOpening, prayerClosing, minister, sermonTheme, sermonType, keyVerse })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="1"
              />
              <span className="self-center">-</span>
              <input
                type="number"
                min="1"
                value={scripture.versesEnd || ''}
                onChange={(e) => onChange({ scripture: { ...scripture, versesEnd: parseInt(e.target.value) || undefined }, prayerOpening, prayerClosing, minister, sermonTheme, sermonType, keyVerse })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <button
          onClick={fetchVerse}
          disabled={loading}
          className="mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <Search size={16} />
          {loading ? 'Cargando...' : 'Buscar y Mostrar Versículo'}
        </button>

        {verseText && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap italic">"{verseText}"</p>
            <p className="text-xs text-gray-500 mt-2">
              {scripture.book} {scripture.chapter}:{scripture.versesStart}
              {scripture.versesEnd && `-${scripture.versesEnd}`} (RVR1960)
            </p>
          </div>
        )}
      </div>

      {/* Prayers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Oración de Apertura
          </label>
          <input
            type="text"
            value={prayerOpening}
            onChange={(e) => onChange({ scripture, prayerOpening: e.target.value, prayerClosing, minister, sermonTheme, sermonType, keyVerse })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Responsable"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Oración de Cierre
          </label>
          <input
            type="text"
            value={prayerClosing}
            onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing: e.target.value, minister, sermonTheme, sermonType, keyVerse })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Responsable"
          />
        </div>
      </div>

      {/* Minister/Preacher */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <User size={20} />
          Predicador / Guía / Líder
        </h3>
        <div className="flex gap-2">
          {members.length > 0 && (
            <select
              value={minister}
              onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing, minister: e.target.value, sermonTheme, sermonType, keyVerse })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar de la lista...</option>
              {members.map((member: string) => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={minister}
            onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing, minister: e.target.value, sermonTheme, sermonType, keyVerse })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="O escribir nombre manualmente"
          />
        </div>
      </div>

      {/* Sermon */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Tipo de Mensaje
        </label>
        <select
          value={sermonType}
          onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing, minister, sermonTheme, sermonType: e.target.value, keyVerse })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {SERMON_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Tema del {sermonType || 'Mensaje'}
        </label>
        <input
          type="text"
          value={sermonTheme}
          onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing, minister, sermonTheme: e.target.value, sermonType, keyVerse })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Ej: El Amor de Dios"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Versículo Clave
        </label>
        <textarea
          value={keyVerse}
          onChange={(e) => onChange({ scripture, prayerOpening, prayerClosing, minister, sermonTheme, sermonType, keyVerse: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
          placeholder='Ej: "Porque de tal manera amó Dios al mundo..." - Juan 3:16'
        />
      </div>
    </div>
  );
};
