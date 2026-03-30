import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthService} from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const response = await this.authService.auth.api.getSession({
        // @ts-ignore
        headers: request.headers,
      });
      if (response?.user) {
        request['user'] = response.user;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
