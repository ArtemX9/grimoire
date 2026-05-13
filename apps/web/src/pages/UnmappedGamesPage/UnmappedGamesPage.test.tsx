import { Platform, UnmappedReasons } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { generateUnmappedGame } from '@/test';

import UnmappedGamesPage from './UnmappedGamesPage';

vi.mock('@/components/IGDBGameSearchDialog/IGDBGameSearchDialogContainer', () => ({
  default: ({ open, initialSearchQuery }: { open: boolean; initialSearchQuery?: string }) =>
    open ? <div data-testid='map-dialog' data-initial-query={initialSearchQuery} /> : null,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderPage(props: Partial<React.ComponentProps<typeof UnmappedGamesPage>> = {}) {
  const defaults = {
    games: [],
    isLoading: false,
    mappingGame: null,
    onMapClick: vi.fn(),
    onDialogOpenChange: vi.fn(),
    onGameSelect: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <UnmappedGamesPage {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('UnmappedGamesPage', () => {
  it('renders the page heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /unresolved games/i })).toBeInTheDocument();
  });

  it('renders an empty state when there are no games', () => {
    renderPage({ games: [] });

    expect(screen.getByText(/all games are mapped/i)).toBeInTheDocument();
  });

  it('renders a card for each unmapped game', () => {
    const games = [
      generateUnmappedGame({ syncedGameTitle: 'Dark Souls', reason: UnmappedReasons.NO_MATCH }),
      generateUnmappedGame({ syncedGameTitle: 'Hollow Knight', reason: UnmappedReasons.LOW_CONFIDENCE }),
    ];

    renderPage({ games });

    expect(screen.getByText('Dark Souls')).toBeInTheDocument();
    expect(screen.getByText('Hollow Knight')).toBeInTheDocument();
  });

  it('calls onMapClick with the correct game when "Map manually" is clicked', async () => {
    const game = generateUnmappedGame({ syncedGameTitle: 'Celeste' });
    const onMapClick = vi.fn();

    renderPage({ games: [game], onMapClick });

    await userEvent.click(screen.getByRole('button', { name: /map manually/i }));

    expect(onMapClick).toHaveBeenCalledWith(game);
  });

  it('does not show the map dialog when mappingGame is null', () => {
    renderPage({ mappingGame: null });

    expect(screen.queryByTestId('map-dialog')).not.toBeInTheDocument();
  });

  it('shows the map dialog when mappingGame is set', () => {
    const game = generateUnmappedGame();

    renderPage({ mappingGame: game });

    expect(screen.getByTestId('map-dialog')).toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    const { container } = renderPage({ isLoading: true });

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('displays the formatted playtime for each game card', () => {
    const game = generateUnmappedGame({ playtimeHours: 2 });

    renderPage({ games: [game] });

    expect(screen.getByText('2 hours played')).toBeInTheDocument();
  });

  it('renders UnmappedSteamGameRow for Steam games', () => {
    const game = generateUnmappedGame({
      syncedGameTitle: 'Hades',
      platform: { id: 1, platform: Platform.STEAM },
    });

    renderPage({ games: [game] });

    expect(screen.getByText('Hades')).toBeInTheDocument();
  });

  it('renders UnmappedPSNGameRow for PlayStation games', () => {
    const game = generateUnmappedGame({
      syncedGameTitle: 'God of War',
      platform: { id: 2, platform: Platform.PlayStation },
    });

    renderPage({ games: [game] });

    expect(screen.getByText('God of War')).toBeInTheDocument();
    expect(screen.getByText(Platform.PlayStation)).toBeInTheDocument();
  });

  it('renders UnmappedXboxGameRow for Xbox games', () => {
    const game = generateUnmappedGame({
      syncedGameTitle: 'Halo Infinite',
      platform: { id: 3, platform: Platform.Xbox },
    });

    renderPage({ games: [game] });

    expect(screen.getByText('Halo Infinite')).toBeInTheDocument();
    expect(screen.getByText(Platform.Xbox)).toBeInTheDocument();
  });

  it('passes syncedGameTitle as initialSearchQuery to the map dialog', () => {
    const game = generateUnmappedGame({ syncedGameTitle: 'Celeste' });

    renderPage({ mappingGame: game });

    expect(screen.getByTestId('map-dialog')).toHaveAttribute('data-initial-query', 'Celeste');
  });

  it('shows cover image when coverURL is provided', () => {
    const game = generateUnmappedGame({
      platform: { id: 1, platform: Platform.STEAM },
      coverURL: 'https://example.com/cover.jpg',
    });

    renderPage({ games: [game] });

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('cover.jpg'));
  });
});
