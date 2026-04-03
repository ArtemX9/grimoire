import {Genre, Mood} from '../constants';

export type RecommendationRequest = {
  moods: Mood[]
  sessionLengthMinutes: number
  userID: string
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
  }>
  recentSessions: Array<{
    gameTitle: string
    durationMin: number
    mood: Mood[]
    startedAt: Date
  }>
}
