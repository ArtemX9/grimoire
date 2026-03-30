import {All, Controller, ForbiddenException, forwardRef, Get, Inject, Post, Req, Res} from '@nestjs/common';

import type { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {UsersService} from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService, private authService: AuthService) {}

  @Get('/get-session')
  @Public()
  async getSession(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.authService.auth.api.getSession({
        // @ts-ignore
        headers: req.headers,
        returnHeaders: true,
        // asResponse: true
      });
      res.status(response.response ? 200 : 400);
      let body = '';
      if (response.response) {
        const extraUserInfo = await this.usersService.findById(response.response.user.id);
        response.headers.forEach((value, key) => res.setHeader(key, value));
        const user = {...response.response.user, ...extraUserInfo};
        body = JSON.stringify({...response.response, user});
      }
      res.send(body);
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }

  @Post('/sign-in/email')
  @Public()
  async emailSignIn(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.authService.auth.api.signInEmail({
        body: {
          email: req.body.email,
          password: req.body.password,
        },
        asResponse: true
      });
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      const body = await response.text();
      res.send(body);
    } catch (error) {
      throw new ForbiddenException(error);
    }
  }
}
