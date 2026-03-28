import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Observable } from 'rxjs';

import { RecommendationContext } from '@grimoire/shared';

import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class GrokProvider implements LLMProvider {
  constructor(private config: ConfigService) {}

  recommend(context: RecommendationContext): Observable<string> {
    return new Observable((subscriber) => {
      const prompt = this.buildPrompt(context);
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
