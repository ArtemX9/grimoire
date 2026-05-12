import { Mood, Platform } from '@grimoire/shared';
import { useEffect, useMemo } from 'react';

import { useGetGames } from '@/api/games';
import { useGetMe } from '@/api/users';
import { useAiStream } from '@/hooks/useAiStream';
import { AI_LAST_RECOMMENDATION_KEY, loadRecommendation, setDesiredPlatform, setSessionLength, toggleMood } from '@/store/aiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import AiPanel from './AiPanel';

interface IAiPanelContainer {
  hideHeader?: boolean;
}

function AiPanelContainer({ hideHeader }: IAiPanelContainer) {
  const { data: me } = useGetMe();
  const { data: games = [] } = useGetGames();
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, streamedTokens, streamedThoughts, isStreaming, desiredPlatform } = useAppSelector((s) => s.ai);
  const { streamRecommendation } = useAiStream(me);

  const aiEnabled = me?.aiEnabled ?? true;

  const availablePlatforms = useMemo(
    () =>
      [...new Set(games.flatMap((g) => g.platforms.map((p) => p.platformName)))].sort((a, b) => (a > b ? 1 : a === b ? 0 : -1)),
    [games],
  );

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
