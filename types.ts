
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  status: string; 
  league: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    over25?: number;
    under25?: number;
    gg?: number;
    ng?: number;
  };
  time?: string;
  date?: string;
}

export interface Standing {
  rank: number;
  team: string;
  played: number;
  points: number;
  goals: string;
  form?: string; 
  formSequence?: ('W' | 'D' | 'L')[];
  nextMatch?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SportsData {
  matches: Match[];
  standings: Record<string, Standing[]>;
  lastUpdated: string;
  sources: GroundingSource[];
}

export interface HistoricalSnapshot {
  id: string;
  timestamp: string;
  data: SportsData;
}

export enum Tab {
  LIVE = 'live',
  STANDINGS = 'standings',
  FAVORITES = 'favorites',
  AI_CHAT = 'ai_chat',
  HISTORY = 'history'
}

export interface AIPrediction {
  prediction: string;
  confidence: string;
  analysis: string;
  thinking?: string;
}

export interface Bet {
  id: string;
  matchId: string;
  matchName: string;
  selection: string;
  odds: number;
  amount: number;
  potentialWin: number;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'goal' | 'start' | 'end' | 'info';
  timestamp: number;
}
