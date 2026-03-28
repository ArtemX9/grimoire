export interface RecommendationRequest {
  moods: string[]
  sessionLengthMinutes: number
  userId: string
}

export interface RecommendationContext {
  moods: string[]
  sessionLengthMinutes: number
  games: Array<{
    title: string
    status: string
    genres: string[]
    playtimeHours: number
    moods: string[]
  }>
  recentSessions: Array<{
    gameTitle: string
    durationMin: number
    mood: string[]
    startedAt: Date
  }>
}
