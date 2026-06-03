import { describe, expect, it } from 'vitest';

import reducer, { UI_SLICE, UiState, setHighlightedGameID, setSelectedGame, toggleAIDrawer, toggleSidebar } from '@/store/state/ui/index';
import { selectHighlightedGameID, selectIsAIDrawerOpen, selectSelectedGameId, selectSidebarOpen } from '@/store/state/ui/selectors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

function makeRootState(overrides: Partial<UiState> = {}) {
  return { [UI_SLICE]: { ...initialState, ...overrides } };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('uiSlice — initial state', () => {
  it('sidebar is open by default', () => {
    expect(initialState.sidebarOpen).toBe(true);
  });

  it('no game is selected by default', () => {
    expect(initialState.selectedGameId).toBeNull();
  });

  it('AI drawer is closed by default', () => {
    expect(initialState.isAIDrawerOpen).toBe(false);
  });

  it('no highlighted game by default', () => {
    expect(initialState.highlightedGameID).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toggleSidebar
// ---------------------------------------------------------------------------

describe('uiSlice — toggleSidebar', () => {
  it('closes an open sidebar', () => {
    const next = reducer(initialState, toggleSidebar());
    expect(next.sidebarOpen).toBe(false);
  });

  it('reopens a closed sidebar', () => {
    const closed = reducer(initialState, toggleSidebar());
    const next = reducer(closed, toggleSidebar());
    expect(next.sidebarOpen).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toggleAIDrawer
// ---------------------------------------------------------------------------

describe('uiSlice — toggleAIDrawer', () => {
  it('opens a closed drawer', () => {
    const next = reducer(initialState, toggleAIDrawer());
    expect(next.isAIDrawerOpen).toBe(true);
  });

  it('closes an open drawer', () => {
    const open = reducer(initialState, toggleAIDrawer());
    const next = reducer(open, toggleAIDrawer());
    expect(next.isAIDrawerOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setSelectedGame
// ---------------------------------------------------------------------------

describe('uiSlice — setSelectedGame', () => {
  it('sets a game id', () => {
    const next = reducer(initialState, setSelectedGame('game-1'));
    expect(next.selectedGameId).toBe('game-1');
  });

  it('clears the selected game when payload is null', () => {
    const withGame = reducer(initialState, setSelectedGame('game-1'));
    const next = reducer(withGame, setSelectedGame(null));
    expect(next.selectedGameId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setHighlightedGameID
// ---------------------------------------------------------------------------

describe('uiSlice — setHighlightedGameID', () => {
  it('sets a highlighted game id', () => {
    const next = reducer(initialState, setHighlightedGameID('game-42'));
    expect(next.highlightedGameID).toBe('game-42');
  });

  it('clears highlighted game when payload is null', () => {
    const withGame = reducer(initialState, setHighlightedGameID('game-42'));
    const next = reducer(withGame, setHighlightedGameID(null));
    expect(next.highlightedGameID).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

describe('ui selectors', () => {
  it('selectSidebarOpen returns sidebarOpen', () => {
    const state = makeRootState({ sidebarOpen: false });
    expect(selectSidebarOpen(state as never)).toBe(false);
  });

  it('selectIsAIDrawerOpen returns isAIDrawerOpen', () => {
    const state = makeRootState({ isAIDrawerOpen: true });
    expect(selectIsAIDrawerOpen(state as never)).toBe(true);
  });

  it('selectSelectedGameId returns selectedGameId', () => {
    const state = makeRootState({ selectedGameId: 'game-5' });
    expect(selectSelectedGameId(state as never)).toBe('game-5');
  });

  it('selectHighlightedGameID returns highlightedGameID', () => {
    const state = makeRootState({ highlightedGameID: 'game-99' });
    expect(selectHighlightedGameID(state as never)).toBe('game-99');
  });
});
