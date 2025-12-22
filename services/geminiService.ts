
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `User coords: ${location.lat}, ${location.lng}.` : "";

  const prompt = `
    [AI FAST TRACK] 
    ACTION: Get LIVE, RECENT (last 24h), and UPCOMING soccer matches for Serie A and major leagues.
    SPECIFIC: Search for Napoli vs Bologna (must include if played today/yesterday).
    CONTEXT: ${locationContext}
    FORMAT: STRICT JSON ONLY.
    
    JSON Schema:
    {
      "matches": [
        {
          "id": "uuid",
          "homeTeam": "Team Name",
          "awayTeam": "Team Name",
          "score": "X-X",
          "status": "Live/FT/HH:MM",
          "league": "Serie A",
          "odds": {"home": 2.1, "draw": 3.2, "away": 3.5},
          "time": "HH:MM"
        }
      ],
      "standings": {
        "Serie A": [
          {
            "rank": 1, 
            "team": "Inter", 
            "played": 25, 
            "points": 66, 
            "goals": "50-12",
            "formSequence": ["W", "W", "D", "W", "L"] 
          }
        ]
      }
    }
    
    Note: 'formSequence' should be an array of last 5 match results: 'W' (win), 'D' (draw), 'L' (loss).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        temperature: 0, 
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 2000 } } : {})
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
              title: chunk.web.title || 'Live Source', 
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
  } catch (error) {
    console.error("Gemini Fetch Error:", error);
    throw error;
  }
};

export const getMatchPrediction = async (home: string, away: string, useThinking: boolean = false): Promise<AIPrediction> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `[PREDICT] ${home} vs ${away}. JSON: {"prediction": "1-1", "confidence": "60%", "analysis": "Quick info"}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0,
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 2000 } } : {})
      },
    });
    return parseAIResponse(response.text || "{}");
  } catch (error) {
    return { prediction: "N/D", confidence: "0%", analysis: "Indisponibile." };
  }
};

export const getHistoricalAnalysis = async (history: HistoricalSnapshot[], useThinking: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `[TRENDS] Analysis of: ${JSON.stringify(history.slice(0,2))}. Concise summary.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        ...(useThinking ? { thinkingConfig: { thinkingBudget: 2000 } } : {})
      }
    });
    return response.text || "Pochi dati.";
  } catch (error) {
    return "Errore analisi.";
  }
};
