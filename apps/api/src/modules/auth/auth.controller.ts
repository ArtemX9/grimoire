import {All, Controller, ForbiddenException, Get, Post, Req, Res} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/get-session')
  async getSession(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.authService.auth.api.getSession({
        // @ts-ignore
        headers: req.headers,
        asResponse: true
      });
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const body = await response.text();
      res.send(body);
    } catch (error) {
      console.log(error);
      throw new ForbiddenException(error);
    }
  }

  @Post('/sign-in/email')
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
      console.log(error);
      throw new ForbiddenException(error);
    }
  }
}
