import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Plan } from '@grimoire/shared';

import { PLAN_FEATURE_KEY } from '../decorators/plan-feature.decorator';
import { PlanGuard } from './plan.guard';

function makeContext(user: unknown): ExecutionContext {
  const handler = () => {};
  return {
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PlanGuard', () => {
  let guard: PlanGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new PlanGuard(reflector);
  });

  describe('no @PlanFeature metadata', () => {
    it('returns true when no feature key is set on the handler', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when feature metadata is null', () => {
      reflector.get.mockReturnValue(null);
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('checks the correct metadata key against the handler', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      guard.canActivate(ctx);

      expect(reflector.get).toHaveBeenCalledWith(PLAN_FEATURE_KEY, ctx.getHandler());
    });
  });

  describe('feature gating — aiRecommendations', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue('aiRecommendations');
    });

    it('returns true for PRO user', () => {
      const ctx = makeContext({ id: 'user-1', plan: Plan.PRO });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for LIFETIME user', () => {
      const ctx = makeContext({ id: 'user-1', plan: Plan.LIFETIME });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException for FREE user', () => {
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('ForbiddenException message mentions higher plan', () => {
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      try {
        guard.canActivate(ctx);
      } catch (err) {
        expect((err as ForbiddenException).message).toBe('Feature requires a higher plan');
      }
    });
  });

  describe('feature gating — numeric features (platformSyncs, maxGames)', () => {
    it('returns true for platformSyncs on FREE plan (value is 1, truthy)', () => {
      reflector.get.mockReturnValue('platformSyncs');
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for platformSyncs on PRO plan', () => {
      reflector.get.mockReturnValue('platformSyncs');
      const ctx = makeContext({ id: 'user-1', plan: Plan.PRO });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for maxGames on FREE plan (value is 50, truthy)', () => {
      reflector.get.mockReturnValue('maxGames');
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('missing or unauthenticated user', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue('aiRecommendations');
    });

    it('returns false when req.user is undefined', () => {
      const ctx = makeContext(undefined);
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('returns false when req.user is null', () => {
      const ctx = makeContext(null);
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  describe('user with unrecognised plan', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue('aiRecommendations');
    });

    it('throws when plan is not in PLAN_FEATURES (features object is undefined)', () => {
      const ctx = makeContext({ id: 'user-1', plan: 'UNKNOWN_PLAN' });

      // PLAN_FEATURES['UNKNOWN_PLAN'] is undefined — accessing a key on undefined throws TypeError
      expect(() => guard.canActivate(ctx)).toThrow();
    });
  });

  describe('all plans for all boolean features', () => {
    const booleanFeature = 'aiRecommendations' as const;

    it.each([
      [Plan.PRO, true],
      [Plan.LIFETIME, true],
    ])('plan %s with aiRecommendations: canActivate returns true', (plan) => {
      reflector.get.mockReturnValue(booleanFeature);
      const ctx = makeContext({ id: 'user-1', plan });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('plan FREE with aiRecommendations: throws ForbiddenException', () => {
      reflector.get.mockReturnValue(booleanFeature);
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('guard is synchronous', () => {
    it('returns a boolean directly, not a Promise', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = makeContext({ id: 'user-1', plan: Plan.FREE });

      const result = guard.canActivate(ctx);

      expect(typeof result).toBe('boolean');
    });
  });
});
