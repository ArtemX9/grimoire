import {Genre, Mood} from '../constants';

export enum GameStatus {
  BACKLOG = 'BACKLOG',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  WISHLIST = 'WISHLIST',
}

export type UserGame = {
  id: string
  userID: string
  igdbID: number
  steamAppID?: number
  title: string
  coverURL?: string
  genres: Genre[]
  status: GameStatus
  playtimeHours: number
  userRating?: number
  notes?: string
  moods: Mood[]
  addedAt: Date
  updatedAt: Date
}

export type IgdbGame = {
  id: number
  name: string
  cover?: { url: string }
  genres?: Genre[]
  summary?: string
  first_release_date?: number
  total_rating?: number
}
