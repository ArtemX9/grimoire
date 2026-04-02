import { describe, expect, it } from 'vitest';

import reducer, { setSelectedGame, toggleSidebar } from '@/store/uiSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

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

  it('toggling three times ends up closed', () => {
    let state = initialState;
    state = reducer(state, toggleSidebar());
    state = reducer(state, toggleSidebar());
    state = reducer(state, toggleSidebar());
    expect(state.sidebarOpen).toBe(false);
  });

  it('does not touch selectedGameId', () => {
    const withGame = reducer(initialState, setSelectedGame('game-42'));
    const next = reducer(withGame, toggleSidebar());
    expect(next.selectedGameId).toBe('game-42');
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

  it('overwrites an existing game id with a new one', () => {
    const withFirst = reducer(initialState, setSelectedGame('game-1'));
    const next = reducer(withFirst, setSelectedGame('game-2'));
    expect(next.selectedGameId).toBe('game-2');
  });

  it('clears the selected game when payload is null', () => {
    const withGame = reducer(initialState, setSelectedGame('game-1'));
    const next = reducer(withGame, setSelectedGame(null));
    expect(next.selectedGameId).toBeNull();
  });

  it('is idempotent — setting the same id twice stays the same', () => {
    const first = reducer(initialState, setSelectedGame('game-99'));
    const second = reducer(first, setSelectedGame('game-99'));
    expect(second.selectedGameId).toBe('game-99');
  });

  it('does not touch sidebarOpen', () => {
    const closed = reducer(initialState, toggleSidebar());
    const next = reducer(closed, setSelectedGame('game-5'));
    expect(next.sidebarOpen).toBe(false);
  });

  it('handles an empty-string id (boundary value)', () => {
    const next = reducer(initialState, setSelectedGame(''));
    expect(next.selectedGameId).toBe('');
  });
});
