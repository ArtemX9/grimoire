import { IgdbGame } from '@grimoire/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { igdbKeys } from '@/api/igdb';
import { generateIgdbGame } from '@/test';

import IGDBGameSearchDialogContainer from './IGDBGameSearchDialogContainer';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// vi.hoisted ensures mockDialog is initialised before the vi.mock factory runs.
const mockDialog = vi.hoisted(() => vi.fn());
vi.mock('./IGDBGameSearchDialog', () => ({ default: mockDialog }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makeGame(overrides: Partial<IgdbGame> = {}): IgdbGame {
  return generateIgdbGame({ id: 1, name: 'Elden Ring', ...overrides });
}

function renderContainer(queryClient: QueryClient, onOpenChange = vi.fn()) {
  render(
    <QueryClientProvider client={queryClient}>
      <IGDBGameSearchDialogContainer
        open={true}
        onOpenChange={onOpenChange}
        onGameSelect={vi.fn()}
        dialogTitle='Test'
        progressIndicatorText='Loading...'
        actionButtonTitle='Add'
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('IGDBGameSearchDialogContainer — close cleanup', () => {
  beforeEach(() => {
    // Render a minimal stand-in that exposes the props we need to drive tests.
    mockDialog.mockImplementation(({ onOpenChange, searchQuery, onSearchChange }: any) => (
      <div>
        <span data-testid='search-query'>{searchQuery}</span>
        <button onClick={() => onSearchChange('Zelda')}>set-query</button>
        <button onClick={() => onOpenChange(false)}>close-dialog</button>
      </div>
    ));
  });

  it('passes empty searchResults and isSearching=false when query is short', () => {
    const queryClient = makeQueryClient();
    renderContainer(queryClient);

    // The mock dialog receives searchResults from the container.
    // With an empty query (< 2 chars), the query is disabled so results should be [].
    // We test this by checking the mock was called with searchResults.
    expect(mockDialog).toHaveBeenCalledWith(expect.objectContaining({ searchResults: [] }), expect.anything());
  });

  it('resets the search query to empty string when the dialog re-opens after the user had typed', async () => {
    const queryClient = makeQueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </QueryClientProvider>,
    );

    // Simulate the user having typed something before closing.
    await userEvent.click(screen.getByRole('button', { name: 'set-query' }));
    expect(screen.getByTestId('search-query')).toHaveTextContent('Zelda');

    // Transition to closed — query is NOT reset yet
    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </QueryClientProvider>,
    );

    // Re-open — the useEffect fires on open=true and resets query to ''
    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-query')).toBeEmptyDOMElement();
  });

  it('calls the parent onOpenChange prop with false when the dialog closes', async () => {
    const queryClient = makeQueryClient();
    const onOpenChange = vi.fn();
    renderContainer(queryClient, onOpenChange);

    await userEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('passes cached search results to dialog when query is long enough', () => {
    const queryClient = makeQueryClient();
    const games = [makeGame(), makeGame({ id: 2, name: 'Hades' })];

    // Pre-seed TanStack Query cache with results for a 2+ char query
    queryClient.setQueryData(igdbKeys.search('El'), games);

    render(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='El'
        />
      </QueryClientProvider>,
    );

    // Results from cache are passed to dialog
    expect(mockDialog).toHaveBeenCalledWith(expect.objectContaining({ searchResults: games }), expect.anything());
  });

  it('initializes searchQuery with initialSearchQuery when provided', () => {
    const queryClient = makeQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Elden Ring'
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Elden Ring');
  });

  it('pre-fills with new initialSearchQuery when dialog is re-opened for a different game', async () => {
    const queryClient = makeQueryClient();
    // Start closed, with first game's title
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game A'
        />
      </QueryClientProvider>,
    );

    // Open with Game A
    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game A'
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Game A');

    // Close, then open with Game B
    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game B'
        />
      </QueryClientProvider>,
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game B'
        />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Game B');
  });

  it('initializes with empty string when no initialSearchQuery is provided and dialog opens', async () => {
    const queryClient = makeQueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </QueryClientProvider>,
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('search-query')).toBeEmptyDOMElement();
  });
});
