import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toggleMood, setSessionLength } from '@/features/ai/aiSlice'
import { useAiStream } from '@/features/ai/useAiStream'
import { Mood } from '@grimoire/shared'

import AiPanel from './AiPanel'

function AiPanelContainer() {
  const dispatch = useAppDispatch()
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming } =
    useAppSelector((s) => s.ai)
  const { streamRecommendation } = useAiStream()

  function handleMoodToggle(mood: string) {
    dispatch(toggleMood(mood as Mood))
  }

  function handleSessionLengthChange(minutes: number) {
    dispatch(setSessionLength(minutes))
  }

  return (
    <AiPanel
      selectedMoods={selectedMoods}
      sessionLengthMinutes={sessionLengthMinutes}
      streamedTokens={streamedTokens}
      isStreaming={isStreaming}
      onMoodToggle={handleMoodToggle}
      onSessionLengthChange={handleSessionLengthChange}
      onRequest={streamRecommendation}
    />
  )
}

export default AiPanelContainer
