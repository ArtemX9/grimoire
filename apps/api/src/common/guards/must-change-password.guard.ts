import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SKIP_MUST_CHANGE_PASSWORD } from '../decorators/skip-must-change-password.decorator';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_MUST_CHANGE_PASSWORD, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return true;

    const request = context.switchToHttp().getRequest();

    // Not authenticated — let AuthGuard handle it
    if (!request.user) return true;

    if (request.user.mustChangePassword) {
      throw new ForbiddenException({
        message: 'Password change required',
        code: 'MUST_CHANGE_PASSWORD',
      });
    }

    return true;
  }
}
