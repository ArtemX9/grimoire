import { RecommendationContext } from '@grimoire/shared';

export function buildPrompt(ctx: RecommendationContext): string {
  return `You are a game recommendation AI. Based on the user's backlog and mood, recommend what to play tonight.

User mood: ${ctx.moods.join(', ')}
Available time: ${ctx.sessionLengthMinutes} minutes

Their library (status / title / genres / hours played):
${ctx.games.map((g) => `- [${g.status}] ${g.title} (${g.genres.join(', ')}) — ${g.playtimeHours}h`).join('\n')}

Recent sessions:
${ctx.recentSessions.map((s) => `- ${s.gameTitle}: ${s.durationMin}min, mood: ${s.mood.join(', ')}`).join('\n')}

Give a specific recommendation from their library with a short, direct reason. Consider their mood, available time, recent play history, and game status. Be concise and opinionated.`;
}
