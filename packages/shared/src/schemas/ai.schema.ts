import { z } from 'zod'

export const RecommendationRequestSchema = z.object({
  moods: z.array(z.string()).min(1),
  sessionLengthMinutes: z.number().int().positive(),
  userId: z.string().min(1),
})

export type RecommendationRequestDto = z.infer<typeof RecommendationRequestSchema>
