import {Genre, Mood} from '../constants';
import { Platform } from './platform';

export type RecommendationRequest = {
  moods: string[];
  sessionLengthMinutes: number;
  userId?: string;
  desiredPlatform?: Platform;
}

export type RecommendationContext = {
  moods: string[]
  sessionLengthMinutes: number
  games: Array<{
    title: string
    status: string
    genres: Genre[]
    playtimeHours: number
    moods: Mood[]
    rating?: number
  }>
  recentSessions: Array<{
    gameTitle: string
    durationMin: number
    mood: Mood[]
    startedAt: Date
    notes?: string
  }>
}
