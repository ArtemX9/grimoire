import { z } from 'zod'
import {Mood} from '../constants';

export const RecommendationRequestSchema = z.object({
  moods: z.array(z.enum(Mood)).min(1),
  sessionLengthMinutes: z.number().int().positive(),
  userId: z.string().min(1),
})

export type RecommendationRequestDto = z.infer<typeof RecommendationRequestSchema>
