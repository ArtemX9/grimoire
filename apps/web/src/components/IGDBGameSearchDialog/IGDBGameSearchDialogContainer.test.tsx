import { AsyncStatus, IgdbGame } from '@grimoire/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { type Reducer, applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import igdbReducer, { IGDB_SLICE } from '@/store/state/igdb/index';
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

function makeStore(searchResults: IgdbGame[] = [], searchStatus = AsyncStatus.Idle) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootReducer: Reducer<any, any> = combineReducers({ [IGDB_SLICE]: igdbReducer });
  return createStore(
    rootReducer,
    {
      [IGDB_SLICE]: {
        searchResults,
        selectedGame: null,
        searchStatus,
        getStatus: AsyncStatus.Idle,
        error: null,
      },
    },
    applyMiddleware(thunk),
  );
}

function makeGame(overrides: Partial<IgdbGame> = {}): IgdbGame {
  return generateIgdbGame({ id: 1, name: 'Elden Ring', ...overrides });
}

function renderContainer(searchResults: IgdbGame[] = [], onOpenChange = vi.fn()) {
  const store = makeStore(searchResults);
  render(
    <Provider store={store}>
      <IGDBGameSearchDialogContainer
        open={true}
        onOpenChange={onOpenChange}
        onGameSelect={vi.fn()}
        dialogTitle='Test'
        progressIndicatorText='Loading...'
        actionButtonTitle='Add'
      />
    </Provider>,
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
    renderContainer([]);

    // The mock dialog receives searchResults from the container.
    // With an empty query (< 2 chars), results should be [].
    expect(mockDialog).toHaveBeenCalledWith(expect.objectContaining({ searchResults: [] }), expect.anything());
  });

  it('resets the search query to empty string when the dialog re-opens after the user had typed', async () => {
    const store = makeStore();
    const { rerender } = render(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </Provider>,
    );

    // Simulate the user having typed something before closing.
    await userEvent.click(screen.getByRole('button', { name: 'set-query' }));
    expect(screen.getByTestId('search-query')).toHaveTextContent('Zelda');

    // Transition to closed — query is NOT reset yet
    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </Provider>,
    );

    // Re-open — the useEffect fires on open=true and resets query to ''
    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </Provider>,
    );
    expect(screen.getByTestId('search-query')).toBeEmptyDOMElement();
  });

  it('calls the parent onOpenChange prop with false when the dialog closes', async () => {
    const onOpenChange = vi.fn();
    renderContainer([], onOpenChange);

    await userEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('passes pre-loaded search results to dialog when available in store', () => {
    const games = [makeGame(), makeGame({ id: 2, name: 'Hades' })];
    renderContainer(games);

    expect(mockDialog).toHaveBeenCalledWith(expect.objectContaining({ searchResults: games }), expect.anything());
  });

  it('initializes searchQuery with initialSearchQuery when provided', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Elden Ring'
        />
      </Provider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Elden Ring');
  });

  it('pre-fills with new initialSearchQuery when dialog is re-opened for a different game', async () => {
    const store = makeStore();
    const { rerender } = render(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game A'
        />
      </Provider>,
    );

    // Open with Game A
    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game A'
        />
      </Provider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Game A');

    // Close, then open with Game B
    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game B'
        />
      </Provider>,
    );

    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
          initialSearchQuery='Game B'
        />
      </Provider>,
    );
    expect(screen.getByTestId('search-query')).toHaveTextContent('Game B');
  });

  it('initializes with empty string when no initialSearchQuery is provided and dialog opens', async () => {
    const store = makeStore();
    const { rerender } = render(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={false}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </Provider>,
    );

    rerender(
      <Provider store={store}>
        <IGDBGameSearchDialogContainer
          open={true}
          onOpenChange={vi.fn()}
          onGameSelect={vi.fn()}
          dialogTitle='Test'
          progressIndicatorText='Loading...'
          actionButtonTitle='Add'
        />
      </Provider>,
    );

    expect(screen.getByTestId('search-query')).toBeEmptyDOMElement();
  });
});
