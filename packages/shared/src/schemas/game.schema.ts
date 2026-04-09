import { z } from 'zod'
import { GameStatus } from '../types'
import {Genre, Mood} from '../constants';

export const CreateGameSchema = z.object({
  igdbId: z.number().int().positive(),
  steamAppId: z.number().int().positive().optional(),
  title: z.string().min(1).max(255),
  coverUrl: z.string().url().optional(),
  genres: z.array(z.enum(Genre)).default([]),
  status: z.enum(GameStatus).default(GameStatus.BACKLOG),
  moods: z.array(z.enum(Mood)).default([]),
  notes: z.string().max(2000).optional(),
})

export const UpdateGameSchema = CreateGameSchema.partial().extend({
  playtimeHours: z.number().min(0).optional(),
  userRating: z.number().int().min(1).max(10).optional(),
})

export type CreateGameDto = z.infer<typeof CreateGameSchema>
export type UpdateGameDto = z.infer<typeof UpdateGameSchema>
