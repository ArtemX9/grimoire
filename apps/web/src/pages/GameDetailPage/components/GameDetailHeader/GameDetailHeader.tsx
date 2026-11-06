import { GamePlatform, GameStatus, Mood, UserGame } from '@grimoire/shared';
import { Check, Clock, Gamepad2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import PlatformIcon from '@/components/PlatformIcon/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GAME_STATUS_LABELS, GAME_STATUS_STYLES } from '@/constants/gameStatus';
import { cn } from '@/utils/cn';

interface IGameDetailHeader {
  game: UserGame;
  isUpdating: boolean;
  onStatusChange: (status: GameStatus) => void;
  onMoodsChange: (moods: Mood[]) => void;
  onLogSessionOpen: (open: boolean) => void;
  onDeleteDialogOpen: (open: boolean) => void;
  onPlatformPickerOpen: (open: boolean) => void;
  onPlatformSelect: (platform: GamePlatform) => void;
  onRemapDialogOpen: (open: boolean) => void;
}

function GameDetailHeader({
  game,
  isUpdating,
  onStatusChange,
  onMoodsChange,
  onLogSessionOpen,
  onDeleteDialogOpen,
  onPlatformPickerOpen,
  onPlatformSelect,
  onRemapDialogOpen,
}: IGameDetailHeader) {
  const [isEditingMoods, setIsEditingMoods] = useState(false);

  const releaseYear = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;
  const metaParts = [releaseYear, ...game.genres.slice(0, 3)].filter(Boolean);

  function handleRemapClick() {
    if (game.platforms.length > 1) {
      onPlatformPickerOpen(true);
    } else if (game.platforms.length === 1) {
      onPlatformSelect(game.platforms[0]);
    } else {
      onRemapDialogOpen(true);
    }
  }

  function handleMoodsEditToggle() {
    setIsEditingMoods((prev) => !prev);
  }

  function handleMoodToggle(mood: Mood) {
    const active = game.moods.includes(mood);
    onMoodsChange(active ? game.moods.filter((m) => m !== mood) : [...game.moods, mood]);
  }

  return (
    <section className='relative overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-card'>
      {renderBackdrop()}
      <div className='relative flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8'>
        {renderCover()}
        {renderHeroDetails()}
      </div>
    </section>
  );

  function renderBackdrop() {
    if (!game.coverURL) return null;

    return (
      <div aria-hidden='true' className='pointer-events-none absolute inset-0'>
        <img src={game.coverURL} alt='' className='h-full w-full scale-125 object-cover opacity-50 blur-3xl' />
        <div className='absolute inset-0 bg-gradient-to-b from-grimoire-card/10 via-grimoire-card/70 to-grimoire-card' />
      </div>
    );
  }

  function renderCover() {
    return (
      <div className='mx-auto w-36 shrink-0 sm:mx-0 sm:w-48 lg:w-52'>
        <div className='relative aspect-[3/4] overflow-hidden rounded-lg border border-grimoire-border bg-grimoire-hover shadow-2xl shadow-black/60'>
          {game.coverURL ? (
            <img src={game.coverURL} alt={game.title} className='absolute inset-0 h-full w-full object-cover' />
          ) : (
            <div className='flex h-full w-full flex-col items-center justify-center gap-2'>
              <Gamepad2 className='h-10 w-10 text-grimoire-muted' />
              <span className='select-none font-grimoire text-2xl text-grimoire-muted'>{game.title.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderHeroDetails() {
    return (
      <div className='flex min-w-0 flex-1 flex-col gap-5'>
        {renderTitleBlock()}
        {renderPrimaryRow()}
        {renderMoods()}
      </div>
    );
  }

  function renderTitleBlock() {
    return (
      <div className='flex flex-col gap-2'>
        <h1 className='font-grimoire text-3xl leading-tight text-grimoire-ink sm:text-4xl'>{game.title}</h1>
        {metaParts.length > 0 && <p className='font-sans text-sm text-grimoire-muted'>{metaParts.join(' · ')}</p>}
        {renderPlatforms()}
      </div>
    );
  }

  function renderPlatforms() {
    if (game.platforms.length === 0) return null;

    return (
      <div className='flex flex-wrap items-center gap-3 font-sans text-sm text-grimoire-muted'>
        {game.platforms.map((p) => (
          <span key={p.platformID} className='flex items-center gap-1.5'>
            <PlatformIcon platform={p.platformName} />
            {p.platformName}
          </span>
        ))}
      </div>
    );
  }

  function renderPrimaryRow() {
    return (
      <div className='flex flex-wrap items-center gap-2'>
        {renderStatusSelect()}
        <span className='mr-auto flex items-center gap-1.5 px-1 font-sans text-sm text-grimoire-muted'>
          <Clock className='h-3.5 w-3.5' />
          {Math.round(game.playtimeHours)}h played
        </span>
        <Button onClick={onLogSessionOpen.bind(null, true)}>
          <Plus className='h-4 w-4' />
          Log session
        </Button>
        {renderSecondaryActions()}
      </div>
    );
  }

  function renderStatusSelect() {
    return (
      <Select value={game.status} onValueChange={(value) => onStatusChange(value as GameStatus)} disabled={isUpdating}>
        <SelectTrigger
          aria-label='Status'
          className={cn('h-9 w-auto gap-2 rounded-full border-transparent px-4 font-medium sm:text-sm', GAME_STATUS_STYLES[game.status])}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(GameStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {GAME_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function renderSecondaryActions() {
    return (
      <div className='flex items-center'>
        <Button variant='ghost' size='icon' onClick={handleRemapClick} aria-label='Re-map to another IGDB entry' title='Re-map'>
          <RefreshCcw className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={onDeleteDialogOpen.bind(null, true)}
          aria-label='Remove from library'
          title='Remove'
          className='hover:bg-grimoire-status-dropped-bg hover:text-grimoire-status-dropped-text'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    );
  }

  function renderMoods() {
    const visibleMoods = isEditingMoods ? Object.values(Mood) : game.moods;

    return (
      <div className='flex flex-col gap-2 border-t border-grimoire-border pt-4'>
        <div className='flex items-center justify-between'>
          <p className='font-sans text-xs font-medium uppercase tracking-wide text-grimoire-muted'>Moods</p>
          <button
            onClick={handleMoodsEditToggle}
            className='flex items-center gap-1 rounded px-1.5 py-1 font-sans text-xs text-grimoire-muted transition-colors hover:text-grimoire-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold'
          >
            {isEditingMoods ? <Check className='h-3.5 w-3.5' /> : <Pencil className='h-3.5 w-3.5' />}
            {isEditingMoods ? 'Done' : 'Edit'}
          </button>
        </div>
        {visibleMoods.length === 0 ? renderNoMoods() : renderMoodChips(visibleMoods)}
      </div>
    );
  }

  function renderNoMoods() {
    return (
      <button
        onClick={handleMoodsEditToggle}
        className='w-fit font-sans text-sm text-grimoire-muted transition-colors hover:text-grimoire-ink'
      >
        No moods yet — tag how this game feels
      </button>
    );
  }

  function renderMoodChips(moods: Mood[]) {
    return (
      <div className='flex flex-wrap gap-1.5'>
        {moods.map((mood) => {
          const active = game.moods.includes(mood);

          return (
            <button
              key={mood}
              onClick={handleMoodToggle.bind(null, mood)}
              disabled={!isEditingMoods || isUpdating}
              className={cn(
                'rounded-full border px-3 py-1 font-sans text-xs transition-colors disabled:cursor-default',
                active
                  ? 'border-grimoire-gold-dim bg-grimoire-gold/10 text-grimoire-gold'
                  : 'border-grimoire-border text-grimoire-muted hover:border-grimoire-border-lg hover:text-grimoire-ink',
                isUpdating && 'opacity-50',
              )}
            >
              {mood}
            </button>
          );
        })}
      </div>
    );
  }
}

export default GameDetailHeader;
