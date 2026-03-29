import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { z } from 'zod';

import { AdminOnly } from '../../common/decorators/admin-only.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAiService } from './admin-ai.service';
import { AdminService } from './admin.service';

const SetupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

const UpdateAiSettingsSchema = z.object({
  globalEnabled: z.boolean().optional(),
  userId: z.string().cuid().optional(),
  userEnabled: z.boolean().optional(),
  userLimit: z.number().int().min(0).nullable().optional(),
});

const UpdateUserAiSchema = z.object({
  aiEnabled: z.boolean(),
  aiRequestsLimit: z.number().int().min(0).nullable(),
});

const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

type SetupAdminDto = z.infer<typeof SetupAdminSchema>;
type CreateUserDto = z.infer<typeof CreateUserSchema>;
type UpdateAiSettingsDto = z.infer<typeof UpdateAiSettingsSchema>;
type UpdateUserAiDto = z.infer<typeof UpdateUserAiSchema>;
type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminAiService: AdminAiService,
  ) {}

  @Post('setup')
  @HttpCode(201)
  setup(@Body(new ZodValidationPipe(SetupAdminSchema)) body: SetupAdminDto) {
    return this.adminService.setupAdmin(body);
  }

  @Get('users')
  @AdminOnly()
  listUsers(@Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @Post('users')
  @AdminOnly()
  @HttpCode(201)
  createUser(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @Delete('users/:id')
  @AdminOnly()
  @HttpCode(204)
  async deleteUser(@CurrentUser() user: RequestUser, @Param('id') targetId: string) {
    await this.adminService.deleteUser(user.id, targetId);
  }

  @Get('stats')
  @AdminOnly()
  getStats() {
    return this.adminService.getStats();
  }

  @Get('settings/ai')
  @AdminOnly()
  getAiSettings() {
    return this.adminAiService.getGlobalSettings();
  }

  @Patch('settings/ai')
  @AdminOnly()
  updateAiSettings(@Body(new ZodValidationPipe(UpdateAiSettingsSchema)) body: UpdateAiSettingsDto) {
    return this.adminAiService.updateSettings(body);
  }

  @Patch('users/:id/ai')
  @AdminOnly()
  @HttpCode(204)
  async updateUserAiSettings(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(UpdateUserAiSchema)) body: UpdateUserAiDto,
  ) {
    await this.adminAiService.updateUserAiSettings(userId, body);
  }
}
