import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PLAN_FEATURES, Plan } from '@grimoire/shared';

import { PLAN_FEATURE_KEY } from '../decorators/plan-feature.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<keyof (typeof PLAN_FEATURES)[Plan]>(PLAN_FEATURE_KEY, context.getHandler());
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const features = PLAN_FEATURES[user.plan as Plan];
    if (!features[feature]) throw new ForbiddenException(`Feature requires a higher plan`);
    return true;
  }
}
