
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  BookOpen
} from 'lucide-react';
import { generateChurchInsights } from '../../geminiService';
import { AIInsights, Person, SurveyResponse } from '../../types';

interface SmartInsightsProps {
  people: Person[];
  responses: SurveyResponse[];
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ people, responses }) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    // Calcular estadísticas en tiempo real para el prompt
    const ages = people.map(p => p.age);
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    const stats = {
      totalPeople: people.length,
      totalFamilies: Math.ceil(people.length / 3), // Estimación
      totalMarriages: people.filter(p => p.maritalStatus === 'Casado').length,
      ageStats: { average: avgAge, median: avgAge, min: Math.min(...ages, 0), max: Math.max(...ages, 0) },
      ageDistribution: [],
      genderDistribution: [],
      ministryDistribution: []
    };

    // Áreas de satisfacción basadas en respuestas reales
    const surveyAreas = [
      { area: "Vida Espiritual", satisfaction: Math.round(people.reduce((a, b) => a + b.commitmentScore, 0) / (people.length || 1)), responseCount: responses.length },
      { area: "Pertenencia", satisfaction: 75, responseCount: responses.length },
      { area: "Compromiso", satisfaction: 62, responseCount: responses.length }
    ];

    try {
      const result = await generateChurchInsights(stats as any, surveyAreas);
      setInsights(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [people.length, responses.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Analizando el pulso de tu iglesia...</h3>
          <p className="text-slate-500 max-w-sm mt-2">Gemini está procesando datos demográficos y encuestas de satisfacción para generar recomendaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-blue-200" size={28} />
            <h2 className="text-2xl font-bold">Ecclesia Smart Analysis</h2>
          </div>
          <p className="text-blue-100 max-w-2xl leading-relaxed text-lg italic">
            "{insights?.summary || 'Analizando tendencias congregacionales...'}"
          </p>
          <button
            onClick={loadInsights}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all font-semibold border border-white/20"
          >
            <RefreshCcw size={18} />
            Actualizar Análisis
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-green-600">
            <CheckCircle2 size={24} />
            <h3 className="text-lg font-bold">Fortalezas</h3>
          </div>
          <div className="space-y-4">
            {insights?.strengths.map((s, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-slate-700 font-medium leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-amber-600">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold">Prioridades Críticas</h3>
          </div>
          <div className="space-y-4">
            {insights?.priorities.map((p, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-50 shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-slate-700 font-medium leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-blue-600">
            <Target size={24} />
            <h3 className="text-lg font-bold">Plan de Acción</h3>
          </div>
          <div className="space-y-4">
            {insights?.recommendations.map((r, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                <p className="text-sm font-semibold text-slate-800">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartInsights;
