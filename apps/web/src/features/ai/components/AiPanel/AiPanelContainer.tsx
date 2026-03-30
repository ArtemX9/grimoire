import { Mood } from '@grimoire/shared';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSessionLength, toggleMood } from '@/features/ai/aiSlice';
import { useAiStream } from '@/features/ai/useAiStream';
import { useGetMeQuery } from '@/features/users/usersApi';

import AiPanel from './AiPanel';

function AiPanelContainer() {
  const { data: me } = useGetMeQuery();
  const dispatch = useAppDispatch();
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming } = useAppSelector((s) => s.ai);
  const { streamRecommendation } = useAiStream(me);

  const aiEnabled = me?.aiEnabled ?? true;

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
