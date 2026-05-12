import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateSessionDto, PlaySession } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { gameKeys } from './games';

export const sessionKeys = {
  all: () => ['sessions'] as const,
  recent: (limit?: number) => [...sessionKeys.all(), 'recent', limit] as const,
  forGame: (gameId: string) => [...sessionKeys.all(), 'game', gameId] as const,
};

async function fetchRecentSessions(limit: number = 10): Promise<PlaySession[]> {
  return apiFetch<PlaySession[]>(`/sessions/recent?limit=${limit}`);
}

async function fetchGameSessions(gameId: string): Promise<PlaySession[]> {
  return apiFetch<PlaySession[]>(`/sessions/game/${gameId}`);
}

async function createSession(body: CreateSessionDto): Promise<PlaySession> {
  return apiFetch<PlaySession>('/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function useGetRecentSessions(limit?: number) {
  return useQuery({
    queryKey: sessionKeys.recent(limit),
    queryFn: () => fetchRecentSessions(limit),
  });
}

export function useGetGameSessions(gameId: string) {
  return useQuery({
    queryKey: sessionKeys.forGame(gameId),
    queryFn: () => fetchGameSessions(gameId),
    enabled: !!gameId,
  });
}

export function useCreateSession() {
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all() });
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}
