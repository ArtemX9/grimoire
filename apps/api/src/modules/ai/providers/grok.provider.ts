import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext } from '@grimoire/shared';

import { buildPrompt } from './common';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class GrokProvider implements LLMProvider {
  constructor(private config: ConfigService) {}

  recommend(context: RecommendationContext): Observable<string> {
    return new Observable((subscriber) => {
      const prompt = buildPrompt(context);
      fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.get('app.llm.grokApiKey')}`,
        },
        body: JSON.stringify({
          model: 'grok-3',
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
        .then(async (res) => {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              subscriber.complete();
              break;
            }
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
            for (const line of lines) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                subscriber.complete();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) subscriber.next(token);
              } catch {}
            }
          }
        })
        .catch((err) => subscriber.error(err));
    });
  }
}
