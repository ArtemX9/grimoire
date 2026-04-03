import {Mood} from '../constants';

export interface PlaySession {
  id: string
  userID: string
  gameID: string
  startedAt: Date
  endedAt?: Date
  durationMin?: number
  mood: Mood[]
  notes?: string
}
