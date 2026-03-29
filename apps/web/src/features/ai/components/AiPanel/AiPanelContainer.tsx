import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toggleMood, setSessionLength } from '@/features/ai/aiSlice'
import { useAiStream } from '@/features/ai/useAiStream'
import { useGetMeQuery } from '@/features/users/usersApi'
import { Mood } from '@grimoire/shared'

import AiPanel from './AiPanel'

function AiPanelContainer() {
  const dispatch = useAppDispatch()
  const { selectedMoods, sessionLengthMinutes, streamedTokens, isStreaming } =
    useAppSelector((s) => s.ai)
  const { streamRecommendation } = useAiStream()
  const { data: me } = useGetMeQuery()

  const aiEnabled = me?.aiEnabled ?? true

  function handleMoodToggle(mood: string) {
    dispatch(toggleMood(mood as Mood))
  }

  function handleSessionLengthChange(minutes: number) {
    dispatch(setSessionLength(minutes))
  }

  function handleRequest() {
    if (!aiEnabled) return
    streamRecommendation()
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
  )
}

export default AiPanelContainer
