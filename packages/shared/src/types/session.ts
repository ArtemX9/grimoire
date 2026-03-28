export interface PlaySession {
  id: string
  userId: string
  gameId: string
  startedAt: Date
  endedAt?: Date
  durationMin?: number
  mood: string[]
  notes?: string
}
