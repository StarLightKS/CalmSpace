
export type Role = 'user' | 'bot';
export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isHighRisk?: boolean;
}

export enum ExerciseType {
  NONE = 'NONE',
  BREATHING_4_6 = 'BREATHING_4_6',
  BOX_BREATHING = 'BOX_BREATHING',
  MEDITATION = 'MEDITATION',
  VOICE_LIVE = 'VOICE_LIVE'
}

export interface MoodEntry {
  id: string;
  score: number; // 0 to 5
  timestamp: Date;
  note?: string;
}

export interface TrustedContact {
  name: string;
  contact: string;
}

export interface UserProfile {
  trustedContacts: TrustedContact[];
  language: Language;
  theme: Theme;
  sleepTime: string; // e.g. "23:00"
  wakeTime: string; // e.g. "07:00"
  isQuietMode: boolean;
}
