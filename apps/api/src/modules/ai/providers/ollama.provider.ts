import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext } from '@grimoire/shared';

import { buildPrompt } from './common';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class OllamaProvider implements LLMProvider {
  constructor(private config: ConfigService) {}

  recommend(context: RecommendationContext): Observable<string> {
    return new Observable((subscriber) => {
      const baseUrl = this.config.get<string>('app.llm.ollamaBaseUrl', 'http://localhost:11434');
      const model = this.config.get<string>('app.llm.ollamaModel', 'llama3.2');

      fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: 'user', content: buildPrompt(context) }],
        }),
      })
        .then(async (res) => {
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              subscriber.complete();
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const token = parsed.message?.content;
                if (token) subscriber.next(token);
                if (parsed.done) {
                  subscriber.complete();
                  return;
                }
              } catch {}
            }
          }
        })
        .catch((err) => subscriber.error(err));
    });
  }
}
