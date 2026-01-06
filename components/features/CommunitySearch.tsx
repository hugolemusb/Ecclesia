
import React, { useState } from 'react';
import { MapPin, Search, Sparkles, ExternalLink, Building2, HeartHandshake, Loader2 } from 'lucide-react';
import { searchCommunityResources } from '../../geminiService';
import { GroundingChunk } from '../../types';

const CommunitySearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, links: GroundingChunk[] } | null>(null);

  // Mock location for Santiago, Chile (same as the church in constants)
  const churchLocation = { lat: -33.4489, lng: -70.6693 };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const res = await searchCommunityResources(query, churchLocation);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inteligencia de Entorno</h2>
            <p className="text-slate-500 text-sm">Descubre recursos locales para fortalecer la obra social de la iglesia.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Bancos de alimentos, refugios, centros juveniles..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Consultar IA
          </button>
        </form>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm leading-relaxed prose prose-slate">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <HeartHandshake className="text-rose-500" size={20} />
                Análisis de Colaboración
              </h3>
              <div className="text-slate-700 whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Ubicaciones Relevantes</h3>
            <div className="space-y-4">
              {result.links.length > 0 ? (
                result.links.map((link, i) => link.maps && (
                  <a
                    key={i}
                    href={link.maps.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate text-sm">{link.maps.title}</p>
                      <p className="text-xs text-blue-600 font-medium">Ver en Google Maps</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-300" />
                  </a>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  No se encontraron vínculos directos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
          <MapPin size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 max-w-xs text-sm">Ingresa una búsqueda para que Gemini analice el entorno geográfico de tu iglesia.</p>
        </div>
      )}
    </div>
  );
};

export default CommunitySearch;
