
import { GoogleGenAI } from "@google/genai";
import { SportsData, AIPrediction, GroundingSource, HistoricalSnapshot } from "../types";

const parseAIResponse = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Parse error:", e);
    return { matches: [], standings: {} };
  }
};

export const fetchSoccerData = async (
  useThinking: boolean = false, 
  useSearch: boolean = true,
  location?: { lat: number; lng: number }
): Promise<SportsData> => {
  // Inizializziamo l'istanza subito prima dell'uso per assicurarci di usare la chiave aggiornata
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `User coords: ${location.lat}, ${location.lng}.` : "";

  const prompt = `
    [RAPIDO] Fornisci JSON match calcio LIVE/RECENTI (Serie A, Premier, Leghe EU).
    Includi Napoli-Bologna se giocata oggi/ieri.
    Context: ${locationContext}
    REGOLE: Solo JSON, no commenti. Lingua: IT.
    
    JSON Schema:
    {
      "matches": [{"id":"uuid","homeTeam":"A","awayTeam":"B","score":"0-0","status":"Live/FT","league":"Serie A","odds":{"home":2.0,"draw":3.0,"away":4.0},"time":"HH:MM"}],
      "standings": {"Serie A": [{"rank":1,"team":"Inter","played":25,"points":66,"goals":"50-12","formSequence":["W"]}]}
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        temperature: 0, 
        thinkingConfig: { thinkingBudget: useThinking ? 15000 : 0 }
      },
    });

    const jsonData = parseAIResponse(response.text || "{}");
    const sources: GroundingSource[] = [];
    
    if (useSearch) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ 
              title: chunk.web.title || 'Info Live', 
              uri: chunk.web.uri 
            });
          }
        });
      }
    }

    return {
      matches: jsonData.matches || [],
      standings: jsonData.standings || {},
      lastUpdated: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      sources: sources
    };
  } catch (error: any) {
    console.error("Gemini Fetch Error:", error);
    // Propaghiamo l'errore originale per permettere ad App.tsx di leggere il codice 429
    throw error;
  }
};

export const getMatchPrediction = async (home: string, away: string, useThinking: boolean = false): Promise<AIPrediction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Predict ${home}-${away}. JSON: {"prediction":"X","confidence":"60%","analysis":"Brief text"}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0,
        thinkingConfig: { thinkingBudget: useThinking ? 10000 : 0 }
      },
    });
    return parseAIResponse(response.text || "{}");
  } catch (error) {
    throw error;
  }
};

export const getHistoricalAnalysis = async (history: HistoricalSnapshot[], useThinking: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analizza trend: ${JSON.stringify(history.slice(0,2))}. Breve sintesi IT.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: useThinking ? 10000 : 0 }
      }
    });
    return response.text || "Dati insufficienti.";
  } catch (error) {
    throw error;
  }
};
