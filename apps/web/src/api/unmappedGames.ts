import { useMutation, useQuery } from '@tanstack/react-query';
import { MapUnmappedGameSchemaDto, UnmappedGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

import { gameKeys } from './games';

export type UnmappedGamesQuery = {
  limit?: number;
  offset?: number;
};

export type MapUnmappedGameArgs = {
  id: string;
  body: MapUnmappedGameSchemaDto;
};

export const unmappedGameKeys = {
  list: (params?: UnmappedGamesQuery) => ['unmapped-games', params] as const,
};

async function fetchUnmappedGames(params: UnmappedGamesQuery = {}): Promise<UnmappedGame[]> {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
  const qs = filtered.length > 0 ? '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString() : '';
  return apiFetch<UnmappedGame[]>(`/unmapped-games${qs}`);
}

async function mapUnmappedGame({ id, body }: MapUnmappedGameArgs): Promise<void> {
  return apiFetch<void>(`/unmapped-games/map/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function useGetUnmappedGames(params?: UnmappedGamesQuery) {
  return useQuery({
    queryKey: unmappedGameKeys.list(params),
    queryFn: () => fetchUnmappedGames(params),
  });
}

export function useMapUnmappedGame() {
  return useMutation({
    mutationFn: mapUnmappedGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unmappedGameKeys.list() });
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
    },
  });
}
