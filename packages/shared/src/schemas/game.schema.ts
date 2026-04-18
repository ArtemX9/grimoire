import { z } from 'zod';
import { GameStatus } from '../types';
import { Genre, Mood } from '../constants';

export const CreateGameSchema = z.object({
  igdbId: z.number().int().positive(),
  externalId: z.string().optional(),
  externalTitle: z.string().min(1).max(255).optional(),
  platformId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  summary: z.string().min(1),
  storyLine: z.string().min(1),
  releaseDate: z.coerce.date(),
  coverUrl: z.string().url().optional(),
  genres: z.array(z.enum(Genre)).default([]),
  status: z.enum(GameStatus).default(GameStatus.BACKLOG),
  moods: z.array(z.enum(Mood)).default([]),
  notes: z.string().max(2000).optional()
});

export const UpdateGameSchema = z.object({
  igdbId: z.number().int().positive().optional(),
  externalId: z.string().optional(),
  externalTitle: z.string().min(1).max(255).optional(),
  platformId: z.number().int().positive().optional(),
  title: z.string().min(1).max(255).optional(),
  summary: z.string().min(1).optional(),
  storyLine: z.string().min(1).optional(),
  releaseDate: z.coerce.date().optional(),
  coverUrl: z.string().url().optional(),
  genres: z.array(z.enum(Genre)).optional(),
  status: z.enum(GameStatus).optional(),
  moods: z.array(z.enum(Mood)).optional(),
  notes: z.string().max(2000).optional(),
  playtimeHours: z.number().min(0).optional(),
  userRating: z.number().int().min(1).max(10).optional(),
});

export const RemapGameSchema = CreateGameSchema.partial().extend({
  igdbId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  coverUrl: z.string().url().optional(),
  genres: z.array(z.enum(Genre)).default([]),
  platformId: z.number().int().positive().optional(),
});

export type CreateGameDto = z.infer<typeof CreateGameSchema>
export type UpdateGameDto = z.infer<typeof UpdateGameSchema>
export type RemapGameDto = z.infer<typeof RemapGameSchema>
