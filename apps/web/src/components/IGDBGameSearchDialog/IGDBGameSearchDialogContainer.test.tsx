import { IgdbGame } from '@grimoire/shared';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import igdbReducer, { searchLoaded } from '@/store/igdbSlice';
import { generateIgdbGame } from '@/test';

import IGDBGameSearchDialogContainer from './IGDBGameSearchDialogContainer';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/api/igdbApi', () => ({
  useSearchIgdbQuery: vi.fn().mockReturnValue({}),
}));

// vi.hoisted ensures mockDialog is initialised before the vi.mock factory runs.
const mockDialog = vi.hoisted(() => vi.fn());
vi.mock('./IGDBGameSearchDialog', () => ({ default: mockDialog }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore() {
  return configureStore({ reducer: { igdb: igdbReducer } });
}

function makeGame(overrides: Partial<IgdbGame> = {}): IgdbGame {
  return generateIgdbGame({ id: 1, name: 'Elden Ring', ...overrides });
}

function renderContainer(
  store: ReturnType<typeof makeStore>,
  onOpenChange = vi.fn(),
) {
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

  it('clears Redux igdb.searchResults when the dialog closes', async () => {
    const store = makeStore();
    store.dispatch(searchLoaded([makeGame(), makeGame({ id: 2, name: 'Hades' })]));

    renderContainer(store);
    await userEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    expect(store.getState().igdb.searchResults).toEqual([]);
  });

  it('resets the search query to empty string when the dialog closes', async () => {
    const store = makeStore();
    renderContainer(store);

    // Simulate the user having typed something before closing.
    await userEvent.click(screen.getByRole('button', { name: 'set-query' }));
    expect(screen.getByTestId('search-query')).toHaveTextContent('Zelda');

    await userEvent.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.getByTestId('search-query')).toHaveTextContent('');
  });

  it('calls the parent onOpenChange prop with false when the dialog closes', async () => {
    const store = makeStore();
    const onOpenChange = vi.fn();
    renderContainer(store, onOpenChange);

    await userEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not clear search results while the dialog stays open', () => {
    const store = makeStore();
    store.dispatch(searchLoaded([makeGame(), makeGame({ id: 2, name: 'Hades' })]));

    renderContainer(store);

    // No close action taken — results must remain untouched.
    expect(store.getState().igdb.searchResults).toHaveLength(2);
  });
});
