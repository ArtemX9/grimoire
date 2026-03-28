import { Observable } from 'rxjs';

import { RecommendationContext } from '@grimoire/shared';

export interface LLMProvider {
  recommend(context: RecommendationContext): Observable<string>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
