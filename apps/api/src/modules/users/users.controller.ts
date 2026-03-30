import { Body, Controller, Get, HttpCode, Patch } from '@nestjs/common';

import { z } from 'zod';

import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { SkipMustChangePassword } from '../../common/decorators/skip-must-change-password.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

const UpdateProfileSchema = z.object({ name: z.string().min(1).max(100).optional() });
type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/password')
  @SkipMustChangePassword()
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
