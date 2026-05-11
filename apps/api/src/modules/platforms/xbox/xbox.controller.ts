import { Controller } from '@nestjs/common';

import { XboxAuthService } from './xbox-auth.service';
import { XboxService } from './xbox.service';

@Controller('platforms/xbox')
export class XboxController {
  constructor(
    private xboxService: XboxService,
    private xboxAuthService: XboxAuthService,
  ) {}
}
