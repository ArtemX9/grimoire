import { z } from 'zod';
import { Genre } from '../constants';

export const MapUnmappedGameSchema = z.object({
  syncedGameID: z.string(),
  isMapped: z.boolean(),
  platformID: z.number().positive(),
  igdbInfo: z.object({
    id: z.number().positive(),
    title: z.string(),
    genres: z.array(z.enum(Genre)),
    releaseDate: z.coerce.date(),
    coverUrl: z.string().url().optional(),
    summary: z.string().optional(),
    storyLine: z.string().optional(),
  }),
})

export type MapUnmappedGameSchemaDto = z.infer<typeof MapUnmappedGameSchema>
