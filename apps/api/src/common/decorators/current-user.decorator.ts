import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  plan: string;
  mustChangePassword: boolean;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
