import { UseGuards, applyDecorators } from '@nestjs/common';

import {IsValidSteamIDGuard} from '../guard/steamID.guard';

export const IsValidSteamID = () => applyDecorators(UseGuards(IsValidSteamIDGuard));
