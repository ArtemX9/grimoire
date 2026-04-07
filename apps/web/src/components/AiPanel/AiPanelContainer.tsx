import { Mood } from '@grimoire/shared';
import { useEffect } from 'react';

import { useGetMeQuery } from '@/api/usersApi';
import { useAiStream } from '@/hooks/useAiStream';
import { AI_LAST_RECOMMENDATION_KEY, loadRecommendation, setSessionLength, toggleMood } from '@/store/aiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import AiPanel from './AiPanel';

function AiPanelContainer() {
  const { data: me } = useGetMeQuery();
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming } = useAppSelector((s) => s.ai);
  const { streamRecommendation } = useAiStream(me);

  const aiEnabled = me?.aiEnabled ?? true;

  useEffect(function rehydrateFromLocalStorage() {
    if (streamedTokens) return;
    const saved = localStorage.getItem(AI_LAST_RECOMMENDATION_KEY);
    if (saved) {
      dispatch(loadRecommendation(saved));
    }
  }, []);

  useEffect(
    function persistRecommendationToLocalStorage() {
      if (!isStreaming && streamedTokens) {
        localStorage.setItem(AI_LAST_RECOMMENDATION_KEY, streamedTokens);
      }
    },
    [isStreaming, streamedTokens],
  );

  function handleMoodToggle(mood: string) {
    dispatch(toggleMood(mood as Mood));
  }

  function handleSessionLengthChange(minutes: number) {
    dispatch(setSessionLength(minutes));
  }

  function handleRequest() {
    if (!aiEnabled) return;
    streamRecommendation();
  }

  return (
    <AiPanel
      selectedMoods={selectedMoods}
      sessionLengthMinutes={sessionLengthMinutes}
      streamedTokens={streamedTokens}
      isStreaming={isStreaming}
      aiEnabled={aiEnabled}
      onMoodToggle={handleMoodToggle}
      onSessionLengthChange={handleSessionLengthChange}
      onRequest={handleRequest}
    />
  );
}

export default AiPanelContainer;
