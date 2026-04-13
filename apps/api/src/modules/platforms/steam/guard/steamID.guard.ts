import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';

@Injectable()
export class IsValidSteamIDGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const steamId = request.query.steamId;

    const steamIDRegex = /^\d{17}$/;
    if (!steamIDRegex.test(steamId)) {
      throw new HttpException('Incorrect Steam ID entered: only 17 digits, without letters', HttpStatus.NOT_ACCEPTABLE);
    }
    return true;
  }
}
