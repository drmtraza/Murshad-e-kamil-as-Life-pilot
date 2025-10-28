
export enum Pillar {
  Mind = "mind",
  Body = "body",
  Heart = "heart",
  Soul = "soul",
}

export enum Language {
  English = "en",
  Urdu = "ur",
}

export interface Scores {
  mind: number;
  body: number;
  heart: number;
  soul: number;
}

export interface DailyAction {
  actionId: string;
  pillar: Pillar;
  text_en: string;
  text_ur: string;
  guidelines_en?: string;
  guidelines_ur?: string;
  isCompleted: boolean;
  targetDate: string;
}

export interface HarmonyData {
  pilotScore: number;
  scores: Scores;
  currentAction: DailyAction;
}

export interface AssessmentAnswers {
  [key: string]: boolean;
}

export interface ChatMessage {
  sender: 'user' | 'murshad';
  text: string;
}

export interface HistoryLog {
    type: 'session' | 'action';
    timestamp: string;
    snippet?: string;
    actionText?: string;
    completed?: boolean;
}

export interface SuggestedAction {
    actionId: string;
    pillar: Pillar;
    text_en: string;
    text_ur: string;
}