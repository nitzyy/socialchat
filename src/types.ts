export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  energy?: string;
  tempo?: string;
  mood?: string;
}

export type ConnectionMode = 'balanced' | 'unbalanced';

export interface UserProfile {
  id: string;
  username: string;
  emotion: string;
  mode: ConnectionMode;
  song: Song | null;
  spotifyStatus: {
    song: string;
    artist: string;
    albumArt: string;
    isPlaying: boolean;
  } | null;
  instagramUsername?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string; // ISO string
  isIcebreaker?: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
  isStart?: boolean;
}

export interface SharedLine {
  points: DrawingPoint[];
  color: string;
  width: number;
  senderId: string;
}

export interface StoryCard {
  id: string;
  quote: string;
  subquote: string;
  theme: 'melancholy' | 'warmth' | 'cloud' | 'cosmic' | 'lavender' | 'neon';
  date: string;
  chatEmotionOne: string;
  chatEmotionTwo: string;
}

export interface HealingPlaylist {
  title: string;
  description: string;
  category: 'healing' | 'calming' | 'hopeful' | 'comforting' | 'grounding' | 'motivational';
  songs: Song[];
}

export interface JournalEntry {
  id: string;
  date: string;
  reflection: string;
  emotionValue: number; // 1 to 5 scale
  emotionWord: string;
  analysis?: {
    auraColor: string; // css gradient config
    summary: string;
    pattern: string;
  };
}

export interface CollectiveMoodData {
  mostCommon: string[];
  totalSubmissions: number;
  atmosphereQuote: string;
  historicalTrend: { hour: string; count: number; primaryEmotion: string }[];
  regionalAura: string; // CSS gradient string
}
