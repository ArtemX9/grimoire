import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateGameDto, GameStatus, Platform, RemapGameDto, SortableField, UpdateGameDto, UserGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';
import { queryClient } from '@/lib/queryClient';

export type GameStats = {
  total: number;
  byStatus: Array<{ status: GameStatus; _count: number }>;
  totalHours: number;
};

export type GamesQuery = {
  status?: GameStatus;
  genre?: string;
  platform?: Platform;
  search?: string;
  sortBy?: SortableField;
  order?: 'asc' | 'desc';
};

export type UpdateGameArgs = {
  id: string;
  data: UpdateGameDto;
};

export type RemapGameArgs = {
  id: string;
  data: RemapGameDto;
};

export const gameKeys = {
  all: () => ['games'] as const,
  list: (params?: GamesQuery) => [...gameKeys.all(), 'list', params] as const,
  detail: (id: string) => [...gameKeys.all(), 'detail', id] as const,
  stats: () => [...gameKeys.all(), 'stats'] as const,
};

function buildGamesUrl(params: GamesQuery = {}): string {
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (filtered.length === 0) return '/games';
  const qs = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
  return `/games?${qs}`;
}

async function fetchGames(params?: GamesQuery): Promise<UserGame[]> {
  return apiFetch<UserGame[]>(buildGamesUrl(params));
}

async function fetchGameStats(): Promise<GameStats> {
  return apiFetch<GameStats>('/games/stats');
}

async function fetchGame(id: string): Promise<UserGame> {
  return apiFetch<UserGame>(`/games/${id}`);
}

async function createGame(body: CreateGameDto): Promise<UserGame> {
  return apiFetch<UserGame>('/games', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function updateGame({ id, data }: UpdateGameArgs): Promise<UserGame> {
  return apiFetch<UserGame>(`/games/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function remapGame({ id, data }: RemapGameArgs): Promise<UserGame> {
  return apiFetch<UserGame>(`/games/${id}/remap`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function deleteGame(id: string): Promise<void> {
  return apiFetch<void>(`/games/${id}`, { method: 'DELETE' });
}

export function useGetGames(params?: GamesQuery) {
  return useQuery({
    queryKey: gameKeys.list(params),
    queryFn: () => fetchGames(params),
  });
}

export function useGetGameStats() {
  return useQuery({
    queryKey: gameKeys.stats(),
    queryFn: fetchGameStats,
  });
}

export function useGetGame(id: string) {
  return useQuery({
    queryKey: gameKeys.detail(id),
    queryFn: () => fetchGame(id),
    enabled: !!id,
  });
}

export function useCreateGame() {
  return useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useUpdateGame() {
  return useMutation({
    mutationFn: updateGame,
    onSuccess: (updatedGame) => {
      queryClient.setQueriesData(
        { queryKey: gameKeys.list() },
        (old: UserGame[] | undefined) => old?.map((g) => (g.id === updatedGame.id ? updatedGame : g)),
      );
      queryClient.setQueryData(gameKeys.detail(updatedGame.id), updatedGame);
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useRemapGame() {
  return useMutation({
    mutationFn: remapGame,
    onSuccess: (updatedGame) => {
      queryClient.setQueriesData(
        { queryKey: gameKeys.list() },
        (old: UserGame[] | undefined) => old?.map((g) => (g.id === updatedGame.id ? updatedGame : g)),
      );
      queryClient.setQueryData(gameKeys.detail(updatedGame.id), updatedGame);
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
    },
  });
}

export function useDeleteGame() {
  return useMutation({
    mutationFn: deleteGame,
    onSuccess: (_void, id) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.list() });
      queryClient.invalidateQueries({ queryKey: gameKeys.stats() });
      queryClient.removeQueries({ queryKey: gameKeys.detail(id) });
    },
  });
}
