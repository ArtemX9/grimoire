import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

import { IgdbGame, GameStatus } from '@grimoire/shared'
import { cn } from '@/shared/utils/cn'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface IAddGameDialog {
  open: boolean
  searchQuery: string
  searchResults: IgdbGame[]
  isSearching: boolean
  isAdding: boolean
  onOpenChange: (open: boolean) => void
  onSearchChange: (q: string) => void
  onAddGame: (game: IgdbGame, status: GameStatus) => void
}

function AddGameDialog({
  open,
  searchQuery,
  searchResults,
  isSearching,
  isAdding,
  onOpenChange,
  onSearchChange,
  onAddGame,
}: IAddGameDialog) {
  const [selectedGame, setSelectedGame] = useState<IgdbGame | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<GameStatus>(GameStatus.BACKLOG)

  const STATUS_OPTIONS = Object.values(GameStatus)

  function handleConfirm() {
    if (!selectedGame) return
    onAddGame(selectedGame, selectedStatus)
    setSelectedGame(null)
    setSelectedStatus(GameStatus.BACKLOG)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedGame(null)
      setSelectedStatus(GameStatus.BACKLOG)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Add a game</DialogTitle>
        </DialogHeader>

        {renderSearch()}
        {selectedGame ? renderConfirm() : renderResults()}
      </DialogContent>
    </Dialog>
  )

  function renderSearch() {
    return (
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-grimoire-muted' />
        <Input
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setSelectedGame(null)
          }}
          placeholder='Search IGDB…'
          autoFocus
          className='pl-9'
        />
      </div>
    )
  }

  function renderResults() {
    if (isSearching) {
      return (
        <div className='flex flex-col gap-2 mt-1'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full rounded-md' />
          ))}
        </div>
      )
    }

    if (!searchQuery) return null

    if (searchResults.length === 0) {
      return (
        <p className='mt-2 font-sans text-sm text-grimoire-muted text-center py-4'>
          No results found
        </p>
      )
    }

    return (
      <div className='flex flex-col gap-1 mt-1 max-h-64 overflow-y-auto'>
        {searchResults.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game)}
            className='flex items-center gap-3 rounded p-2 text-left transition-colors hover:bg-grimoire-hover'
          >
            {game.cover ? (
              <img
                src={game.cover.url.replace('t_thumb', 't_cover_small')}
                alt={game.name}
                className='h-10 w-7 rounded object-cover shrink-0'
              />
            ) : (
              <div className='h-10 w-7 rounded bg-grimoire-hover shrink-0 flex items-center justify-center'>
                <span className='font-grimoire text-xs text-grimoire-faint'>G</span>
              </div>
            )}
            <div className='flex flex-col min-w-0'>
              <span className='font-grimoire text-sm text-grimoire-ink truncate'>{game.name}</span>
              {game.genres && game.genres.length > 0 && (
                <span className='font-sans text-xs text-grimoire-muted'>
                  {game.genres.slice(0, 2).map((g) => g.name).join(', ')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    )
  }

  function renderConfirm() {
    if (!selectedGame) return null

    return (
      <div className='flex flex-col gap-4 mt-1'>
        <div className='flex items-center gap-3 rounded border border-grimoire-border p-3'>
          {selectedGame.cover ? (
            <img
              src={selectedGame.cover.url.replace('t_thumb', 't_cover_small')}
              alt={selectedGame.name}
              className='h-12 w-8 rounded object-cover shrink-0'
            />
          ) : (
            <div className='h-12 w-8 rounded bg-grimoire-hover shrink-0' />
          )}
          <span className='font-grimoire text-sm text-grimoire-ink'>{selectedGame.name}</span>
        </div>

        <div className='flex flex-col gap-2'>
          <p className='font-sans text-xs text-grimoire-muted'>Add to list</p>
          <div className='flex flex-wrap gap-1.5'>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  'rounded-full border px-3 py-1 font-sans text-xs transition-colors',
                  selectedStatus === status
                    ? 'border-grimoire-gold bg-grimoire-gold/10 text-grimoire-gold'
                    : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                )}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setSelectedGame(null)}
          >
            Back
          </Button>
          <Button
            size='sm'
            onClick={handleConfirm}
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                Adding…
              </>
            ) : (
              'Add to library'
            )}
          </Button>
        </div>
      </div>
    )
  }
}

export default AddGameDialog
