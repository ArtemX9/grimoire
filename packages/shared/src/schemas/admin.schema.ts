import { z } from 'zod'

export const SetupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const UpdateAiSettingsSchema = z.object({
  globalEnabled: z.boolean().optional(),
  userId: z.string().cuid().optional(),
  userEnabled: z.boolean().optional(),
  userLimit: z.number().int().min(0).nullable().optional(),
})

export type SetupAdminDto = z.infer<typeof SetupAdminSchema>
export type CreateUserDto = z.infer<typeof CreateUserSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>
export type UpdateAiSettingsDto = z.infer<typeof UpdateAiSettingsSchema>