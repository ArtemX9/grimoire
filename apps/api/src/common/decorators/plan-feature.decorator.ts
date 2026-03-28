import { SetMetadata } from '@nestjs/common';

import { PLAN_FEATURES } from '@grimoire/shared';
import { Plan } from '@grimoire/shared';

export const PLAN_FEATURE_KEY = 'planFeature';

export const PlanFeature = (feature: keyof (typeof PLAN_FEATURES)[Plan]) => SetMetadata(PLAN_FEATURE_KEY, feature);
