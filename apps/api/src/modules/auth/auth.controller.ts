import { All, Controller, Req, Res } from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const response = await this.authService.auth.handler(req as unknown as globalThis.Request);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    const body = await response.text();
    res.send(body);
  }
}
