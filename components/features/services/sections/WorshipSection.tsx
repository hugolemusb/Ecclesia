import React, { useState } from 'react';
import { Plus, Trash2, Music } from 'lucide-react';
import { Song } from '../../../../types/services';

interface WorshipSectionProps {
  songs: Song[];
  leader: string;
  onChange: (data: { songs: Song[]; leader: string }) => void;
}

export const WorshipSection: React.FC<WorshipSectionProps> = ({ songs, leader, onChange }) => {
  const addSong = () => {
    const newSong: Song = {
      id: `song-${Date.now()}`,
      name: '',
      artist: '',
      key: 'C',
      duration: 5,
    };
    onChange({ songs: [...songs, newSong], leader });
  };

  const removeSong = (id: string) => {
    onChange({ songs: songs.filter(s => s.id !== id), leader });
  };

  const updateSong = (id: string, field: keyof Song, value: any) => {
    onChange({
      songs: songs.map(s => s.id === id ? { ...s, [field]: value } : s),
      leader
    });
  };

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Líder de Adoración
        </label>
        <input
          type="text"
          value={leader}
          onChange={(e) => onChange({ songs, leader: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Nombre del líder"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Music size={20} />
          Canciones
        </h3>
        <button
          onClick={addSong}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
        >
          <Plus size={16} />
          Añadir Canción
        </button>
      </div>

      {songs.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No hay canciones añadidas. Haz clic en "Añadir Canción" para empezar.
        </p>
      ) : (
        <div className="space-y-3">
          {songs.map((song, idx) => (
            <div key={song.id} className="p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {idx + 1}. Nombre de la Canción *
                    </label>
                    <input
                      type="text"
                      required
                      value={song.name}
                      onChange={(e) => updateSong(song.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ej: Sublime Gracia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Artista/Compositor
                    </label>
                    <input
                      type="text"
                      value={song.artist}
                      onChange={(e) => updateSong(song.id, 'artist', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Tono Musical
                    </label>
                    <select
                      value={song.key}
                      onChange={(e) => updateSong(song.id, 'key', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={song.duration}
                      onChange={(e) => updateSong(song.id, 'duration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSong(song.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {songs.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800">
            ⏱️ Tiempo total de adoración: <span className="text-lg">{totalDuration} minutos</span>
          </p>
        </div>
      )}
    </div>
  );
};
