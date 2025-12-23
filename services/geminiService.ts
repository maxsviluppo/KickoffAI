
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
  // CRITICAL: Always create a new instance right before use to get latest API Key from dialog
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `Coordinate utente: ${location.lat}, ${location.lng}.` : "";

  const prompt = `
    [URGENTE] Fornisci JSON match calcio LIVE/RECENTI per Serie A, Premier League, La Liga e Bundesliga.
    Usa Google Search per dati reali di OGGI.
    Context: ${locationContext}
    REGOLE: Restituisci esclusivamente un oggetto JSON valido, no testo discorsivo. Lingua: Italiano.
    
    JSON Schema richiesto:
    {
      "matches": [{"id":"uuid","homeTeam":"Squadra A","awayTeam":"Squadra B","score":"0-0","status":"Live/Terminata","league":"Serie A","odds":{"home":2.0,"draw":3.0,"away":4.0},"time":"Ora/Minuto"}],
      "standings": {"Serie A": [{"rank":1,"team":"Squadra","played":25,"points":60,"goals":"40-20","formSequence":["W","D"]}]}
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
              title: chunk.web.title || 'Dettaglio Fonte', 
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
    throw error;
  }
};

export const getMatchPrediction = async (home: string, away: string, useThinking: boolean = false): Promise<AIPrediction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analizza e prevedi l'esito di ${home} vs ${away}. JSON: {"prediction":"1/X/2","confidence":"X%","analysis":"Testo breve"}`;
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
  const prompt = `Analizza i trend storici di questi snapshot calcistici: ${JSON.stringify(history.slice(0,3))}. Fornisci una sintesi tattica in italiano.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: useThinking ? 10000 : 0 }
      }
    });
    return response.text || "Dati insufficienti per l'analisi.";
  } catch (error) {
    throw error;
  }
};
