import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { z } from 'zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

const UpdateProfileSchema = z.object({ name: z.string().min(1).max(100).optional() });
type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, body);
  }
}
