import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';

import {
  CreateUserDto,
  CreateUserSchema,
  ListUsersQuery,
  ListUsersQuerySchema,
  SetupAdminDto,
  SetupAdminSchema,
  UpdateAiSettingsDto,
  UpdateAiSettingsSchema,
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

  @Post('setup') @Public() @HttpCode(201) setup(@Body(new ZodValidationPipe(SetupAdminSchema)) body: SetupAdminDto) {
    return this.adminService.setupAdmin(body);
  }

  @Get('users') @AdminOnly() listUsers(@Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @Post('users') @AdminOnly() @HttpCode(201) createUser(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @Delete('users/:id') @AdminOnly() @HttpCode(204) async deleteUser(@CurrentUser() user: RequestUser, @Param('id') targetId: string) {
    await this.adminService.deleteUser(user.id, targetId);
  }

  @Patch('users/:id/plan') @AdminOnly() updateUserPlan(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserPlanSchema)) body: UpdateUserPlanDto,
  ) {
    return this.adminService.updateUserPlan(user.id, id, body.plan);
  }

  @Patch('users/:id/role') @AdminOnly() updateUserRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserRoleSchema)) body: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user.id, id, body.role);
  }

  @Get('stats') @AdminOnly() getStats() {
    return this.adminService.getStats();
  }

  @Get('settings/ai') @AdminOnly() getAiSettings() {
    return this.adminAiService.getGlobalSettings();
  }

  @Patch('settings/ai') @AdminOnly() updateAiSettings(@Body(new ZodValidationPipe(UpdateAiSettingsSchema)) body: UpdateAiSettingsDto) {
    return this.adminAiService.updateSettings(body);
  }

  @Patch('users/:id/ai') @AdminOnly() @HttpCode(204) async updateUserAiSettings(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(UpdateUserAiSchema)) body: UpdateUserAiDto,
  ) {
    await this.adminAiService.updateUserAiSettings(userId, body);
  }
}
