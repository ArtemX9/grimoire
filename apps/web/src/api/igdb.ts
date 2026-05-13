import { useQuery } from '@tanstack/react-query';
import { IgdbGame } from '@grimoire/shared';

import { apiFetch } from '@/lib/apiFetch';

export const igdbKeys = {
  search: (q: string) => ['igdb', 'search', q] as const,
  game: (id: number) => ['igdb', 'game', id] as const,
};

async function searchIgdb(q: string): Promise<IgdbGame[]> {
  return apiFetch<IgdbGame[]>(`/igdb/search?q=${encodeURIComponent(q)}`);
}

async function getIgdbGame(id: number): Promise<IgdbGame> {
  return apiFetch<IgdbGame>(`/igdb/${id}`);
}

export function useSearchIgdb(q: string) {
  return useQuery({
    queryKey: igdbKeys.search(q),
    queryFn: () => searchIgdb(q),
    enabled: q.length >= 2,
  });
}

export function useGetIgdbGame(id: number) {
  return useQuery({
    queryKey: igdbKeys.game(id),
    queryFn: () => getIgdbGame(id),
    enabled: !!id,
  });
}
