import { Genre, Mood } from '../constants';
import { PlatformType } from './platform';

export enum GameStatus {
  BACKLOG = 'BACKLOG', PLAYING = 'PLAYING', COMPLETED = 'COMPLETED', DROPPED = 'DROPPED', WISHLIST = 'WISHLIST',
}

export type UserGame = {
  id: string
  userID: string
  igdbID: number
  externalTitle?: string
  platforms: PlatformType[]
  title: string
  genres: Genre[]
  status: GameStatus
  playtimeHours: number
  moods: Mood[]
  addedAt: Date
  updatedAt: Date
  userRating?: number
  coverURL?: string
  notes?: string
}

export type IgdbGame = {
  id: number
  name: string
  summary?: string
  first_release_date?: number
  cover?: string
  genres?: Genre[]
  total_rating?: number
}

export type IgdbGameRaw = {
  id: number
  name: string
  cover?: {
    url: string
  }
  genres?: {
    id: number;
    name: Genre
  }[]
  summary?: string
  first_release_date?: number
  total_rating?: number
}
