import { Body, Controller, MessageEvent, Post, Sse, UseGuards } from '@nestjs/common';

import { Observable, map } from 'rxjs';

import { RecommendationRequest, RecommendationRequestSchema } from '@grimoire/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanFeature } from '../../common/decorators/plan-feature.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('recommend/stream')
  @UseGuards(PlanGuard)
  @PlanFeature('aiRecommendations')
  @Sse()
  async streamRecommendation(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(RecommendationRequestSchema)) body: RecommendationRequest,
  ): Promise<Observable<MessageEvent>> {
    const context = await this.aiService.buildContext(user.id, body);
    return this.aiService.streamRecommendation(context).pipe(map((token) => ({ data: { token } }) as MessageEvent));
  }
}
