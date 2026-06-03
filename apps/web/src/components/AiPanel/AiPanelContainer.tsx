import { Mood, Platform } from '@grimoire/shared';
import { useEffect } from 'react';

import { useAiStream } from '@/hooks/useAiStream';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AI_LAST_RECOMMENDATION_KEY, loadRecommendation, setDesiredPlatform, setSessionLength, toggleMood } from '@/store/state/ai/index';
import {
  selectDesiredPlatform,
  selectIsStreaming,
  selectSelectedMoods,
  selectSessionLengthMinutes,
  selectStreamedThoughts,
  selectStreamedTokens,
} from '@/store/state/ai/selectors';
import { selectAvailablePlatforms } from '@/store/state/games/selectors';
import { selectCurrentUser } from '@/store/state/users/selectors';

import AiPanel from './AiPanel';

interface IAiPanelContainer {
  hideHeader?: boolean;
}

function AiPanelContainer({ hideHeader }: IAiPanelContainer) {
  const dispatch = useAppDispatch();

  const me = useAppSelector(selectCurrentUser);
  const selectedMoods = useAppSelector(selectSelectedMoods);
  const sessionLengthMinutes = useAppSelector(selectSessionLengthMinutes);
  const streamedTokens = useAppSelector(selectStreamedTokens);
  const streamedThoughts = useAppSelector(selectStreamedThoughts);
  const isStreaming = useAppSelector(selectIsStreaming);
  const desiredPlatform = useAppSelector(selectDesiredPlatform);
  const availablePlatforms = useAppSelector(selectAvailablePlatforms);

  const { streamRecommendation } = useAiStream(me ?? undefined);

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

  function handlePlatformChange(platform: Platform | undefined) {
    dispatch(setDesiredPlatform(platform));
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
      streamedThoughts={streamedThoughts}
      isStreaming={isStreaming}
      aiEnabled={aiEnabled}
      availablePlatforms={availablePlatforms}
      selectedPlatform={desiredPlatform}
      hideHeader={hideHeader}
      onMoodToggle={handleMoodToggle}
      onSessionLengthChange={handleSessionLengthChange}
      onPlatformChange={handlePlatformChange}
      onRequest={handleRequest}
    />
  );
}

export default AiPanelContainer;
