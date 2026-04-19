import { Genre, Mood } from '../constants';
import { Platform } from './platform';

export enum GameStatus {
  BACKLOG = 'BACKLOG', PLAYING = 'PLAYING', COMPLETED = 'COMPLETED', DROPPED = 'DROPPED', WISHLIST = 'WISHLIST',
}

export type GamePlatform = {
  platformID: number;
  platformName: Platform;
  externalID: string;
  externalTitle: string;
}

export type UserGame = {
  id: string
  userID: string
  igdbID: number
  title: string
  coverURL?: string
  genres: Genre[]
  status: GameStatus
  playtimeHours: number
  userRating?: number
  notes?: string
  moods: Mood[]
  addedAt: Date
  releaseDate: Date | null
  updatedAt: Date
  isMappedManually: boolean
  platforms: GamePlatform[]
}

export type IgdbGame = {
  id: number
  name: string
  summary?: string
  first_release_date?: number
  cover?: string
  genres?: Genre[]
  storyline?: string;
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
  storyline?: string;
  first_release_date?: number
  total_rating?: number
}
