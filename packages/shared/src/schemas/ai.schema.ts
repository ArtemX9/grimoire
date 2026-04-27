import { z } from 'zod'
import {Mood} from '../constants';
import { Platform } from '../types';

export const RecommendationRequestSchema = z.object({
  moods: z.array(z.enum(Mood)).min(1),
  sessionLengthMinutes: z.number().int().positive(),
  desiredPlatform: z.enum(Platform).optional(),
  userId: z.string().min(1),
})

export type RecommendationRequestDto = z.infer<typeof RecommendationRequestSchema>
