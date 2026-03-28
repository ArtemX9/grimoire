export enum GameStatus {
  BACKLOG = 'BACKLOG',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  WISHLIST = 'WISHLIST',
}

export interface UserGame {
  id: string
  userId: string
  igdbId: number
  steamAppId?: number
  title: string
  coverUrl?: string
  genres: string[]
  status: GameStatus
  playtimeHours: number
  userRating?: number
  notes?: string
  moods: string[]
  addedAt: Date
  updatedAt: Date
}

export interface IgdbGame {
  id: number
  name: string
  cover?: { url: string }
  genres?: Array<{ name: string }>
  summary?: string
  first_release_date?: number
  total_rating?: number
}
