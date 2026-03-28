import { z } from 'zod'

export const CreateSessionSchema = z.object({
  gameId: z.string().min(1),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  durationMin: z.number().int().positive().optional(),
  mood: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
})

export const UpdateSessionSchema = CreateSessionSchema.partial()

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>
