
export type Role = 'user' | 'bot';

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
  MEDITATION = 'MEDITATION'
}

export interface MoodEntry {
  id: string;
  score: number; // 0 to 5
  timestamp: Date;
  note?: string;
}

export interface UserProfile {
  trustedContactName: string;
  trustedContactEmail: string;
  reminderEnabled: boolean;
}
