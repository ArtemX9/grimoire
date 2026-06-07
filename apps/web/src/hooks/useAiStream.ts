import { AI_RESPONSE_TYPE, ToolName, User, parseRecommendationMessage } from '@grimoire/shared';
import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { appendThought, appendToken, startStreaming, stopStreaming } from '@/store/state/ai/index';
import { selectDesiredPlatform, selectSelectedMoods, selectSessionLengthMinutes } from '@/store/state/ai/selectors';
import { resetFilters } from '@/store/state/filters/index';
import { setHighlightedGameID } from '@/store/state/ui/index';

export function useAiStream(me: User | undefined) {
  const dispatch = useAppDispatch();
  const selectedMoods = useAppSelector(selectSelectedMoods);
  const sessionLengthMinutes = useAppSelector(selectSessionLengthMinutes);
  const desiredPlatform = useAppSelector(selectDesiredPlatform);

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
                        dispatch(resetFilters());
                        dispatch(setHighlightedGameID(gameID));
                        break;
                      }
                    }
                    break;
                  case AI_RESPONSE_TYPE.THINK:
                    dispatch(appendThought(recommendationMessage.thoughts));
                    break;
                  case AI_RESPONSE_TYPE.ERROR:
                    throw new Error(recommendationMessage.error);
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
    [dispatch, selectedMoods, sessionLengthMinutes, desiredPlatform],
  );

  return { streamRecommendation };
}
