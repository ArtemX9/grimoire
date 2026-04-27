import { UseGuards, applyDecorators } from '@nestjs/common';

import { DemoGuard } from '../guards/demo.guard';

export const NotDemo = () => applyDecorators(UseGuards(DemoGuard));
