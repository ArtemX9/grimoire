import { z } from 'zod'
import {Plan, Role} from '../types';

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

export const UpdateUserAiSchema = z.object({
  aiEnabled: z.boolean(),
  aiRequestsLimit: z.number().int().min(0).nullable(),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateUserPlanSchema = z.object({
  plan: z.enum(Plan),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(Role),
});

export type SetupAdminDto = z.infer<typeof SetupAdminSchema>
export type CreateUserDto = z.infer<typeof CreateUserSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>
export type UpdateAiSettingsDto = z.infer<typeof UpdateAiSettingsSchema>
export type UpdateUserAiDto = z.infer<typeof UpdateUserAiSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type UpdateUserPlanDto = z.infer<typeof UpdateUserPlanSchema>;
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;
