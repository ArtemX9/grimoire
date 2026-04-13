import { RecommendationContext } from '@grimoire/shared';

export function buildPrompt(ctx: RecommendationContext): string {
  return `You are a game recommendation AI. Based on the user's backlog and mood, recommend exactly one game to play tonight.

User mood: ${ctx.moods.join(', ')};
Available time: ${ctx.sessionLengthMinutes} minutes;

Their library (status / title / genres / hours played):
${ctx.games.map((g) => `- [${g.status}] ${g.title} (${g.genres.join(', ')}) — ${g.playtimeHours}h`).join('\n')}

Recent sessions:
${ctx.recentSessions.map((s) => `- ${s.gameTitle}: ${s.durationMin}min, mood: ${s.mood.join(', ')}`).join('\n')}

Rules:
- Recommend only one specific game from the provided library.
- Prioritize [PLAYING] games first if they correspond to user mood, then [BACKLOG]. Never recommend [COMPLETED] and [DROPPED] games.
- Match the current mood (${ctx.moods.join(', ')}).
- Must be realistic for ${ctx.sessionLengthMinutes} minutes.
- Be concise and opinionated. One short paragraph max: name the game + direct reason why it’s the perfect pick tonight.`;
}
