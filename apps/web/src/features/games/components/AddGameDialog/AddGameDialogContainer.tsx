import { useState } from 'react'

import { IgdbGame, GameStatus } from '@grimoire/shared'
import { useSearchIgdbQuery } from '@/features/igdb/igdbApi'
import { useCreateGameMutation } from '@/features/games/gamesApi'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { toast } from '@/shared/components/ui/use-toast'

import AddGameDialog from './AddGameDialog'

interface IAddGameDialogContainer {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AddGameDialogContainer({ open, onOpenChange }: IAddGameDialogContainer) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 400)

  const { data: searchResults = [], isFetching: isSearching } = useSearchIgdbQuery(
    debouncedQuery,
    { skip: debouncedQuery.length < 2 },
  )

  const [createGame, { isLoading: isAdding }] = useCreateGameMutation()

  async function handleAddGame(game: IgdbGame, status: GameStatus) {
    try {
      const coverURL = !!game.cover ?  'https:' + game.cover.url.replace('t_thumb', 't_cover_big') : undefined;
      await createGame({
        igdbId: game.id,
        title: game.name,
        coverUrl: coverURL,
        genres: game.genres?.map((g) => g.name) ?? [],
        status,
        moods: [],
      }).unwrap()
      toast({ title: `${game.name} added to your library` })
      onOpenChange(false)
      setSearchQuery('')
    } catch {
      toast({ title: 'Failed to add game', variant: 'destructive' })
    }
  }

  return (
    <AddGameDialog
      open={open}
      searchQuery={searchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      isAdding={isAdding}
      onOpenChange={onOpenChange}
      onSearchChange={setSearchQuery}
      onAddGame={handleAddGame}
    />
  )
}

export default AddGameDialogContainer
