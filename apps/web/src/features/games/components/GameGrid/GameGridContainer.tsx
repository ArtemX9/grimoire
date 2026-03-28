import { useAppSelector } from '@/app/hooks'
import { useGetGamesQuery } from '@/features/games/gamesApi'
import { useDebounce } from '@/shared/hooks/useDebounce'

import GameGrid from './GameGrid'

function GameGridContainer() {
  const filters = useAppSelector((s) => s.filters)
  const debouncedSearch = useDebounce(filters.search, 300)

  const { data, isLoading } = useGetGamesQuery({
    status: filters.status ?? undefined,
    genre: filters.genre ?? undefined,
    search: debouncedSearch || undefined,
  })

  return <GameGrid games={data ?? []} isLoading={isLoading} />
}

export default GameGridContainer
