import { AI_RESPONSE_TYPE, ToolName, User, parseRecommendationMessage } from '@grimoire/shared';
import { useCallback } from 'react';

import { appendToken, startStreaming, stopStreaming } from '@/store/aiSlice';
import { resetFilters } from '@/store/filtersSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setHighlightedGameID } from '@/store/uiSlice';

export function useAiStream(me?: User) {
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, desiredPlatform } = useAppSelector((s) => s.ai);
  const games = useAppSelector((s) => s.games.games);

  const streamRecommendation = useCallback(
    async function fetchRecommendationStream() {
      dispatch(startStreaming());
      try {
        const res = await fetch('/api/v1/ai/recommend/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ moods: selectedMoods, sessionLengthMinutes, userId: me?.id, desiredPlatform }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.token) {
                const recommendationMessage = parseRecommendationMessage(parsed.token);
                switch (recommendationMessage.type) {
                  case AI_RESPONSE_TYPE.TEXT:
                    dispatch(appendToken(recommendationMessage.text));
                    break;
                  case AI_RESPONSE_TYPE.TOOL_CALL:
                    switch (recommendationMessage.name) {
                      case ToolName.HIGHLIGHT_GAME: {
                        const gameID = recommendationMessage.arguments.gameID as string;
                        if (!games.some((g) => g.id === gameID)) {
                          dispatch(resetFilters());
                        }
                        dispatch(setHighlightedGameID(gameID));
                        break;
                      }
                    }
                    break;
                  case AI_RESPONSE_TYPE.ERROR:
                    throw new Error(recommendationMessage.error);
                  default:
                    console.error(`Unimplemented yet type has been passed in: ${parsed.token}`);
                }
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }
      } finally {
        dispatch(stopStreaming());
      }
    },
    [dispatch, selectedMoods, sessionLengthMinutes, desiredPlatform, games],
  );

  return { streamRecommendation };
}
