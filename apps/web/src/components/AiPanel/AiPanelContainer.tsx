import { Mood, Platform } from '@grimoire/shared';
import { useEffect, useMemo } from 'react';

import { useGetMeQuery } from '@/api/usersApi';
import { useAiStream } from '@/hooks/useAiStream';
import { AI_LAST_RECOMMENDATION_KEY, loadRecommendation, setDesiredPlatform, setSessionLength, toggleMood } from '@/store/aiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import AiPanel from './AiPanel';

function AiPanelContainer() {
  const { data: me } = useGetMeQuery();
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming, desiredPlatform } = useAppSelector((s) => s.ai);
  const games = useAppSelector((s) => s.games.games);
  const { streamRecommendation } = useAiStream(me);

  const aiEnabled = me?.aiEnabled ?? true;

  const availablePlatforms = useMemo(
    function deriveAvailablePlatforms() {
      const platformSet = new Set<Platform>();
      for (const game of games) {
        for (const gp of game.platforms) {
          platformSet.add(gp.platformName);
        }
      }
      return Array.from(platformSet);
    },
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
      isStreaming={isStreaming}
      aiEnabled={aiEnabled}
      availablePlatforms={availablePlatforms}
      selectedPlatform={desiredPlatform}
      onMoodToggle={handleMoodToggle}
      onSessionLengthChange={handleSessionLengthChange}
      onPlatformChange={handlePlatformChange}
      onRequest={handleRequest}
    />
  );
}

export default AiPanelContainer;
