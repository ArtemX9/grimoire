import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext } from '@grimoire/shared';

import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class ClaudeProvider implements LLMProvider {
  constructor(private config: ConfigService) {}

  recommend(context: RecommendationContext): Observable<string> {
    return new Observable((subscriber) => {
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.get('app.llm.anthropicApiKey')!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          stream: true,
          messages: [{ role: 'user', content: this.buildPrompt(context) }],
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
            const lines = decoder
              .decode(value)
              .split('\n')
              .filter((l) => l.startsWith('data: '));
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line.replace('data: ', ''));
                if (parsed.type === 'content_block_delta') subscriber.next(parsed.delta.text);
                if (parsed.type === 'message_stop') subscriber.complete();
              } catch {}
            }
          }
        })
        .catch((err) => subscriber.error(err));
    });
  }

  private buildPrompt(ctx: RecommendationContext): string {
    return `You are a game recommendation AI. Based on the user's backlog and mood, recommend what to play tonight.

User mood: ${ctx.moods.join(', ')}
Available time: ${ctx.sessionLengthMinutes} minutes

Their library (status / title / genres / hours played):
${ctx.games.map((g) => `- [${g.status}] ${g.title} (${g.genres.join(', ')}) — ${g.playtimeHours}h`).join('\n')}

Recent sessions:
${ctx.recentSessions.map((s) => `- ${s.gameTitle}: ${s.durationMin}min, mood: ${s.mood.join(', ')}`).join('\n')}

Give a specific recommendation from their library with a short, direct reason. Consider their mood, available time, recent play history, and game status. Be concise and opinionated.`;
  }
}
