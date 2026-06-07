import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';

import {
  CreateUserDto,
  CreateUserSchema,
  ListUsersQuery,
  ListUsersQuerySchema,
  Platform,
  SetupAdminDto,
  SetupAdminSchema,
  UpdateAiSettingsDto,
  UpdateAiSettingsSchema,
  UpdatePlatformTokenInfo,
  UpdatePlatformTokenInfoDto,
  UpdateUserAiDto,
  UpdateUserAiSchema,
  UpdateUserPlanDto,
  UpdateUserPlanSchema,
  UpdateUserRoleDto,
  UpdateUserRoleSchema,
} from '@grimoire/shared';

import { AdminOnly } from '../../common/decorators/admin-only.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAiService } from './admin-ai.service';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminAiService: AdminAiService,
  ) {}

  @Public()
  @Post('setup')
  @HttpCode(201)
  setup(@Body(new ZodValidationPipe(SetupAdminSchema)) body: SetupAdminDto) {
    return this.adminService.setupAdmin(body);
  }

  @AdminOnly()
  @Get('users')
  listUsers(@Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @AdminOnly()
  @Post('users')
  @HttpCode(201)
  createUser(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @AdminOnly()
  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@CurrentUser() user: RequestUser, @Param('id') targetId: string) {
    await this.adminService.deleteUser(user.id, targetId);
  }
  @AdminOnly()
  @Patch('users/:id/plan')
  updateUserPlan(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserPlanSchema)) body: UpdateUserPlanDto,
  ) {
    return this.adminService.updateUserPlan(user.id, id, body.plan);
  }

  @AdminOnly()
  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserRoleSchema)) body: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user.id, id, body.role);
  }

  @AdminOnly()
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @AdminOnly()
  @Get('settings/ai')
  getAiSettings() {
    return this.adminAiService.getGlobalSettings();
  }

  @AdminOnly()
  @Patch('settings/ai')
  updateAiSettings(@Body(new ZodValidationPipe(UpdateAiSettingsSchema)) body: UpdateAiSettingsDto) {
    return this.adminAiService.updateSettings(body);
  }

  @AdminOnly()
  @Patch('users/:id/ai')
  @HttpCode(204)
  async updateUserAiSettings(@Param('id') userId: string, @Body(new ZodValidationPipe(UpdateUserAiSchema)) body: UpdateUserAiDto) {
    await this.adminAiService.updateUserAiSettings(userId, body);
  }

  @AdminOnly()
  @Get('settings/platforms')
  async getPlatformsTokens() {
    return this.adminService.getPlatformTokens();
  }

  @AdminOnly()
  @Patch('settings/platforms/:id')
  async updatePlatformTokens(
    @Param('id') platformID: Platform,
    @Body(new ZodValidationPipe(UpdatePlatformTokenInfo)) body: UpdatePlatformTokenInfoDto,
  ) {
    return this.adminService.updatePlatformTokens(platformID, body);
  }
}
