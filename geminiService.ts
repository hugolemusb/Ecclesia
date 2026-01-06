
import { GoogleGenAI, Type } from "@google/genai";
import { DemographicStats, SurveyResult, AIInsights } from './types';

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates pastoral insights based on demographic and survey data.
 */
export const generateChurchInsights = async (
  stats: DemographicStats,
  surveys: SurveyResult[]
): Promise<AIInsights> => {
  const prompt = `
    Analyze the following church data and provide strategic pastoral insights.
    
    DEMOGRAPHICS:
    Total People: ${stats.totalPeople}
    Total Families: ${stats.totalFamilies}
    Age Average: ${stats.ageStats.average}
    Age Distribution: ${JSON.stringify(stats.ageDistribution)}
    Gender Distribution: ${JSON.stringify(stats.genderDistribution)}
    
    SURVEY SATISFACTION (0-100%):
    ${surveys.map(s => `${s.area}: ${s.satisfaction}%`).join('\n')}
    
    Return the analysis in a structured JSON format with the following keys:
    - summary: A 2-3 sentence overview.
    - strengths: List of 3 key strengths.
    - priorities: List of 3 areas needing immediate attention.
    - recommendations: List of 4 actionable pastoral steps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "strengths", "priorities", "recommendations"],
        },
      },
    });

    // property text is used, not a method call
    const text = response.text;
    if (!text) throw new Error("AI returned empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      summary: "No se pudieron generar los insights automáticos en este momento.",
      strengths: ["Resiliencia de la comunidad", "Compromiso histórico", "Deseo de crecimiento"],
      priorities: ["Fortalecer la comunicación", "Evaluar programas de alcance", "Optimizar recursos"],
      recommendations: ["Programar una asamblea general", "Entrevistar a líderes de área", "Revisar el presupuesto trimestral", "Implementar nuevas encuestas"]
    };
  }
};

/**
 * Searches for local community resources using Google Maps grounding.
 * Only supported in Gemini 2.5 series models.
 */
export const searchCommunityResources = async (query: string, location: { lat: number, lng: number }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for community resources or social services related to: "${query}" near my church location. Summarize the best options and explain how the church could collaborate with them.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }
      },
    });

    return {
      text: response.text || "No hay resultados disponibles en este momento.",
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error searching community:", error);
    return {
      text: "Error al conectar con Google Maps. Por favor intente más tarde.",
      links: []
    };
  }
};
