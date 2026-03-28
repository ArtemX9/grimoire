import { useCallback } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { appendToken, startStreaming, stopStreaming } from '@/features/ai/aiSlice'

export function useAiStream() {
  const dispatch = useAppDispatch()
  const { selectedMoods, sessionLengthMinutes } = useAppSelector((s) => s.ai)

  const streamRecommendation = useCallback(
    async function fetchRecommendationStream() {
      dispatch(startStreaming())
      try {
        const res = await fetch('/api/v1/ai/recommend/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ moods: selectedMoods, sessionLengthMinutes }),
        })

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.data?.token) {
                dispatch(appendToken(parsed.data.token))
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }
      } finally {
        dispatch(stopStreaming())
      }
    },
    [dispatch, selectedMoods, sessionLengthMinutes],
  )

  return { streamRecommendation }
}
