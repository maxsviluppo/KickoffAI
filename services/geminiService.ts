
import { GoogleGenAI } from "@google/genai";
import { SportsData, AIPrediction, GroundingSource, HistoricalSnapshot } from "../types";

const parseAIResponse = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `Coordinate utente: ${location.lat}, ${location.lng}.` : "";
  const prompt = `
    Fornisci JSON match calcio LIVE/RECENTI per Serie A, Premier League, La Liga e Bundesliga di OGGI.
    Usa Google Search per dati reali. ${locationContext}
    Restituisci esclusivamente un oggetto JSON valido in Italiano.
    Schema: {"matches": [{"id":"uuid","homeTeam":"...","awayTeam":"...","score":"...","status":"...","league":"...","odds":{"home":0,"draw":0,"away":0},"time":"..."}],"standings": {"Serie A": [{"rank":1,"team":"...","played":0,"points":0,"goals":"0-0","formSequence":["W"]}]}}
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
          if (chunk.web) sources.push({ title: chunk.web.title || 'Dettaglio', uri: chunk.web.uri });
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
  const prompt = `Analizza e prevedi ${home} vs ${away}. JSON: {"prediction":"1/X/2","confidence":"X%","analysis":"Testo breve"}`;
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
  } catch (error) { throw error; }
};

export const getHistoricalAnalysis = async (
  history: HistoricalSnapshot[], 
  favorites: string[],
  useThinking: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const favoritesCtx = favorites.length > 0 ? `Analizza specificamente queste squadre preferite: ${favorites.join(", ")}.` : "Analizza i trend generali.";
  
  const prompt = `
    Sei un analista tattico senior. Basandoti su questi dati storici recenti: ${JSON.stringify(history.slice(0, 5))}
    ${favoritesCtx}
    Fornisci un report dettagliato in Italiano strutturato così:
    1. RIEPILOGO PRESTAZIONI: Come si sono comportate le squadre preferite negli ultimi snapshot?
    2. TREND DI FORMA: Chi è in ascesa e chi in difficoltà?
    3. PROIEZIONI FUTURE: Cosa aspettarsi dai prossimi match basandosi sulla solidità difensiva e realizzativa mostrata?
    Usa un tono professionale e analitico. Evita discorsi generici.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: useThinking ? 15000 : 0 } 
      }
    });
    return response.text || "Dati insufficienti per generare un'analisi accurata.";
  } catch (error) { 
    console.error("History Analysis Error:", error);
    throw error; 
  }
};
