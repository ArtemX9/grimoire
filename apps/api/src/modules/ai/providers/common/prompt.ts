import { RecommendationContext, ToolName } from '@grimoire/shared';

export function buildPrompt(ctx: RecommendationContext): string {
  return `You are a game recommendation AI. Based on the user's backlog and mood, recommend exactly one game to play tonight.

User mood: ${ctx.moods.join(', ')};
Available time: ${ctx.sessionLengthMinutes} minutes;

Their library (status / gameID / title / (genres) / hours played by user / user rating / game summary):
${ctx.games.map((g) => `- [${g.status}] ${g.gameID} | ${g.title} | (${g.genres.join(', ')}) | ${Math.round(g.playtimeHours * 10) / 10}h | Rating: ${g.rating ? `${g.rating} / 10` : 'Not rated yet'} |\n  ${g.summary ? g.summary.replaceAll('\n', ' ').slice(0, 200) + '...' : ''}`).join('\n')}

${ctx.recentSessions.length ? 'Recent sessions:' : ''}
${ctx.recentSessions.map((s) => `- ${s.gameTitle}: ${s.durationMin}min, mood: ${s.mood.join(', ')}, user notes: \n"${s.notes}"\n`).join('\n')}

Rules:
- Decide which game user should play
- Return your reasoning in ONE short, opinionated paragraph (name the game + direct reason why it’s the perfect pick tonight), remember gameID but do not show to user, you will need it soon.
- After that make a tool call: ${ToolName.HIGHLIGHT_GAME}(gameID) with chosen gameID from previous rule.
- Recommend ONLY ONE specific game from the provided library.
- Prioritize [PLAYING] games first if they correspond to user mood, then [BACKLOG].
- Match the current mood (${ctx.moods.join(', ')}).
- Must be realistic for ${ctx.sessionLengthMinutes} minutes.
- Be concise and opinionated. One short paragraph max: name the game + direct reason why it’s the perfect pick tonight.

Tools Patterns:
Game for tonight picked -> ${ToolName.HIGHLIGHT_GAME}("cmo52w5hm0002lycffsmjl0n0")
`;
}
