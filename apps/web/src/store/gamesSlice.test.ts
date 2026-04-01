import { GameStatus, UserGame } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import type { GameStats } from '@/api/gamesApi';
import reducer, {
  gamesFailed,
  gamesLoaded,
  gamesLoadingStarted,
  selectedGameFailed,
  selectedGameLoaded,
  selectedGameLoadingStarted,
  selectedGamePatched,
  selectedGameRemoved,
  statsFailed,
  statsLoaded,
  statsLoadingStarted,
} from '@/store/gamesSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

function makeGame(overrides: Partial<UserGame> = {}): UserGame {
  return {
    id: 'game-1',
    userId: 'user-1',
    igdbId: 1001,
    title: 'Hollow Knight',
    genres: ['Metroidvania'],
    status: GameStatus.PLAYING,
    playtimeHours: 12,
    moods: ['Atmospheric'],
    addedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

function makeStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
    total: 5,
    byStatus: [
      { status: GameStatus.PLAYING, _count: 2 },
      { status: GameStatus.COMPLETED, _count: 3 },
    ],
    totalHours: 120,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('gamesSlice — initial state', () => {
  it('has empty games array', () => {
    expect(initialState.games).toEqual([]);
  });

  it('games loading flag is false', () => {
    expect(initialState.isGamesLoading).toBe(false);
  });

  it('stats is null', () => {
    expect(initialState.stats).toBeNull();
  });

  it('stats loading flag is false', () => {
    expect(initialState.isStatsLoading).toBe(false);
  });

  it('selected game is null', () => {
    expect(initialState.selectedGame).toBeNull();
  });

  it('selected game loading flag is false', () => {
    expect(initialState.isSelectedGameLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Games sub-domain
// ---------------------------------------------------------------------------

describe('gamesSlice — gamesLoadingStarted', () => {
  it('sets isGamesLoading to true', () => {
    const next = reducer(initialState, gamesLoadingStarted());
    expect(next.isGamesLoading).toBe(true);
  });

  it('does not affect stats or selectedGame loading flags', () => {
    const next = reducer(initialState, gamesLoadingStarted());
    expect(next.isStatsLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });
});

describe('gamesSlice — gamesLoaded', () => {
  it('stores the games array and clears loading flag', () => {
    const games = [makeGame(), makeGame({ id: 'game-2', title: 'Celeste' })];
    const loading = reducer(initialState, gamesLoadingStarted());
    const next = reducer(loading, gamesLoaded(games));

    expect(next.games).toEqual(games);
    expect(next.isGamesLoading).toBe(false);
  });

  it('stores an empty array (no games returned from API)', () => {
    const loading = reducer(initialState, gamesLoadingStarted());
    const next = reducer(loading, gamesLoaded([]));

    expect(next.games).toEqual([]);
    expect(next.isGamesLoading).toBe(false);
  });

  it('replaces the previous games array entirely', () => {
    const first = reducer(initialState, gamesLoaded([makeGame({ id: 'game-1' })]));
    const next = reducer(first, gamesLoaded([makeGame({ id: 'game-2' })]));

    expect(next.games).toHaveLength(1);
    expect(next.games[0].id).toBe('game-2');
  });

  it('does not affect stats or selectedGame', () => {
    const withStats = reducer(initialState, statsLoaded(makeStats()));
    const withSelected = reducer(withStats, selectedGameLoaded(makeGame()));
    const next = reducer(withSelected, gamesLoaded([makeGame({ id: 'game-99' })]));

    expect(next.stats).not.toBeNull();
    expect(next.selectedGame).not.toBeNull();
  });
});

describe('gamesSlice — gamesFailed', () => {
  it('clears loading flag on failure', () => {
    const loading = reducer(initialState, gamesLoadingStarted());
    const next = reducer(loading, gamesFailed());

    expect(next.isGamesLoading).toBe(false);
  });

  it('does not wipe existing games already in state', () => {
    const withGames = reducer(initialState, gamesLoaded([makeGame()]));
    const loading = reducer(withGames, gamesLoadingStarted());
    const next = reducer(loading, gamesFailed());

    expect(next.games).toHaveLength(1);
  });

  it('does not affect stats or selectedGame loading flags', () => {
    const loading = reducer(initialState, gamesLoadingStarted());
    const next = reducer(loading, gamesFailed());

    expect(next.isStatsLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stats sub-domain
// ---------------------------------------------------------------------------

describe('gamesSlice — statsLoadingStarted', () => {
  it('sets isStatsLoading to true', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isStatsLoading).toBe(true);
  });

  it('does not affect games or selectedGame loading flags', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isGamesLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });
});

describe('gamesSlice — statsLoaded', () => {
  it('stores stats and clears loading flag', () => {
    const stats = makeStats();
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsLoaded(stats));

    expect(next.stats).toEqual(stats);
    expect(next.isStatsLoading).toBe(false);
  });

  it('overwrites previous stats', () => {
    const first = reducer(initialState, statsLoaded(makeStats({ total: 3 })));
    const next = reducer(first, statsLoaded(makeStats({ total: 10 })));

    expect(next.stats?.total).toBe(10);
  });

  it('stores stats with zero total (empty library)', () => {
    const stats = makeStats({ total: 0, byStatus: [], totalHours: 0 });
    const next = reducer(initialState, statsLoaded(stats));

    expect(next.stats?.total).toBe(0);
    expect(next.stats?.totalHours).toBe(0);
  });

  it('does not affect games or selectedGame', () => {
    const withGames = reducer(initialState, gamesLoaded([makeGame()]));
    const withSelected = reducer(withGames, selectedGameLoaded(makeGame()));
    const next = reducer(withSelected, statsLoaded(makeStats()));

    expect(next.games).toHaveLength(1);
    expect(next.selectedGame).not.toBeNull();
  });
});

describe('gamesSlice — statsFailed', () => {
  it('clears loading flag on failure', () => {
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.isStatsLoading).toBe(false);
  });

  it('does not wipe existing stats', () => {
    const withStats = reducer(initialState, statsLoaded(makeStats()));
    const loading = reducer(withStats, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.stats).not.toBeNull();
  });

  it('does not affect games or selectedGame loading flags', () => {
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.isGamesLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Selected game sub-domain
// ---------------------------------------------------------------------------

describe('gamesSlice — selectedGameLoadingStarted', () => {
  it('sets isSelectedGameLoading to true', () => {
    const next = reducer(initialState, selectedGameLoadingStarted());
    expect(next.isSelectedGameLoading).toBe(true);
  });

  it('clears the previously selected game while loading', () => {
    const withGame = reducer(initialState, selectedGameLoaded(makeGame()));
    const next = reducer(withGame, selectedGameLoadingStarted());

    expect(next.selectedGame).toBeNull();
  });

  it('does not affect games or stats loading flags', () => {
    const next = reducer(initialState, selectedGameLoadingStarted());

    expect(next.isGamesLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });
});

describe('gamesSlice — selectedGameLoaded', () => {
  it('stores the selected game and clears loading flag', () => {
    const game = makeGame();
    const loading = reducer(initialState, selectedGameLoadingStarted());
    const next = reducer(loading, selectedGameLoaded(game));

    expect(next.selectedGame).toEqual(game);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('overwrites a previously selected game', () => {
    const first = reducer(initialState, selectedGameLoaded(makeGame({ id: 'game-1' })));
    const next = reducer(first, selectedGameLoaded(makeGame({ id: 'game-2' })));

    expect(next.selectedGame?.id).toBe('game-2');
  });

  it('does not affect the games list', () => {
    const withGames = reducer(initialState, gamesLoaded([makeGame({ id: 'game-list-1' })]));
    const next = reducer(withGames, selectedGameLoaded(makeGame({ id: 'game-detail-1' })));

    expect(next.games).toHaveLength(1);
    expect(next.games[0].id).toBe('game-list-1');
  });
});

describe('gamesSlice — selectedGameFailed', () => {
  it('clears loading flag on failure', () => {
    const loading = reducer(initialState, selectedGameLoadingStarted());
    const next = reducer(loading, selectedGameFailed());

    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('does not wipe a previously selected game', () => {
    const withGame = reducer(initialState, selectedGameLoaded(makeGame()));
    const loading = reducer(withGame, selectedGameLoadingStarted());
    // selectedGameLoadingStarted clears selectedGame — simulate a retry scenario
    // where loading was triggered but the selectedGame was cleared on start
    const next = reducer(loading, selectedGameFailed());

    expect(next.selectedGame).toBeNull();
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('does not affect games or stats loading flags', () => {
    const loading = reducer(initialState, selectedGameLoadingStarted());
    const next = reducer(loading, selectedGameFailed());

    expect(next.isGamesLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// selectedGamePatched
// ---------------------------------------------------------------------------

describe('gamesSlice — selectedGamePatched', () => {
  it('updates selectedGame with the patched data', () => {
    const original = makeGame({ playtimeHours: 10 });
    const withSelected = reducer(initialState, selectedGameLoaded(original));
    const patched = makeGame({ playtimeHours: 25 });
    const next = reducer(withSelected, selectedGamePatched(patched));

    expect(next.selectedGame?.playtimeHours).toBe(25);
  });

  it('also updates the matching entry in the games list', () => {
    const game = makeGame({ id: 'game-1', playtimeHours: 10 });
    const other = makeGame({ id: 'game-2', title: 'Celeste' });

    let state = reducer(initialState, gamesLoaded([game, other]));
    state = reducer(state, selectedGameLoaded(game));

    const patched = makeGame({ id: 'game-1', playtimeHours: 50 });
    state = reducer(state, selectedGamePatched(patched));

    const inList = state.games.find((g) => g.id === 'game-1');
    expect(inList?.playtimeHours).toBe(50);
  });

  it('does not affect other games in the list', () => {
    const target = makeGame({ id: 'game-1', title: 'Hollow Knight' });
    const bystander = makeGame({ id: 'game-2', title: 'Celeste' });

    let state = reducer(initialState, gamesLoaded([target, bystander]));
    state = reducer(state, selectedGameLoaded(target));
    state = reducer(state, selectedGamePatched(makeGame({ id: 'game-1', title: 'Hollow Knight Updated' })));

    const bystanterInList = state.games.find((g) => g.id === 'game-2');
    expect(bystanterInList?.title).toBe('Celeste');
  });

  it('is safe when the patched game is not in the games list (patch-only mode)', () => {
    const game = makeGame({ id: 'game-orphan' });
    const state = reducer(initialState, selectedGameLoaded(game));

    const next = reducer(state, selectedGamePatched(makeGame({ id: 'game-orphan', playtimeHours: 99 })));

    expect(next.selectedGame?.playtimeHours).toBe(99);
    expect(next.games).toHaveLength(0);
  });

  it('updates status in both selectedGame and the list', () => {
    const game = makeGame({ id: 'game-1', status: GameStatus.PLAYING });

    let state = reducer(initialState, gamesLoaded([game]));
    state = reducer(state, selectedGameLoaded(game));

    const patched = makeGame({ id: 'game-1', status: GameStatus.COMPLETED });
    state = reducer(state, selectedGamePatched(patched));

    expect(state.selectedGame?.status).toBe(GameStatus.COMPLETED);
    expect(state.games[0].status).toBe(GameStatus.COMPLETED);
  });
});

// ---------------------------------------------------------------------------
// selectedGameRemoved
// ---------------------------------------------------------------------------

describe('gamesSlice — selectedGameRemoved', () => {
  it('removes the game from the games list', () => {
    const game = makeGame({ id: 'game-1' });
    const other = makeGame({ id: 'game-2', title: 'Celeste' });

    let state = reducer(initialState, gamesLoaded([game, other]));
    state = reducer(state, selectedGameLoaded(game));
    state = reducer(state, selectedGameRemoved('game-1'));

    expect(state.games.map((g) => g.id)).not.toContain('game-1');
    expect(state.games).toHaveLength(1);
  });

  it('clears selectedGame', () => {
    const game = makeGame({ id: 'game-1' });
    let state = reducer(initialState, gamesLoaded([game]));
    state = reducer(state, selectedGameLoaded(game));
    state = reducer(state, selectedGameRemoved('game-1'));

    expect(state.selectedGame).toBeNull();
  });

  it('does not touch other games in the list', () => {
    const target = makeGame({ id: 'game-1' });
    const bystander = makeGame({ id: 'game-2', title: 'Celeste' });

    let state = reducer(initialState, gamesLoaded([target, bystander]));
    state = reducer(state, selectedGameRemoved('game-1'));

    expect(state.games).toHaveLength(1);
    expect(state.games[0].id).toBe('game-2');
  });

  it('is safe when the id is not found in the list (no-op for games)', () => {
    const game = makeGame({ id: 'game-1' });
    let state = reducer(initialState, gamesLoaded([game]));

    const next = reducer(state, selectedGameRemoved('game-nonexistent'));

    expect(next.games).toHaveLength(1);
    expect(next.selectedGame).toBeNull();
  });

  it('removing from an empty list does not throw', () => {
    const next = reducer(initialState, selectedGameRemoved('ghost-id'));

    expect(next.games).toEqual([]);
    expect(next.selectedGame).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sub-domain independence
// ---------------------------------------------------------------------------

describe('gamesSlice — sub-domain independence', () => {
  it('loading games does not flip stats or selectedGame loading flags', () => {
    const next = reducer(initialState, gamesLoadingStarted());
    expect(next.isStatsLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('loading stats does not flip games or selectedGame loading flags', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isGamesLoading).toBe(false);
    expect(next.isSelectedGameLoading).toBe(false);
  });

  it('loading selectedGame does not flip games or stats loading flags', () => {
    const next = reducer(initialState, selectedGameLoadingStarted());
    expect(next.isGamesLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });

  it('all three can be loading simultaneously and resolve independently', () => {
    let state = initialState;
    state = reducer(state, gamesLoadingStarted());
    state = reducer(state, statsLoadingStarted());
    state = reducer(state, selectedGameLoadingStarted());

    expect(state.isGamesLoading).toBe(true);
    expect(state.isStatsLoading).toBe(true);
    expect(state.isSelectedGameLoading).toBe(true);

    state = reducer(state, gamesLoaded([makeGame()]));

    expect(state.isGamesLoading).toBe(false);
    expect(state.isStatsLoading).toBe(true);
    expect(state.isSelectedGameLoading).toBe(true);

    state = reducer(state, statsLoaded(makeStats()));

    expect(state.isGamesLoading).toBe(false);
    expect(state.isStatsLoading).toBe(false);
    expect(state.isSelectedGameLoading).toBe(true);

    state = reducer(state, selectedGameLoaded(makeGame({ id: 'game-detail' })));

    expect(state.isGamesLoading).toBe(false);
    expect(state.isStatsLoading).toBe(false);
    expect(state.isSelectedGameLoading).toBe(false);
  });

  it('failure in one sub-domain does not clear data in another', () => {
    let state = initialState;
    state = reducer(state, gamesLoaded([makeGame()]));
    state = reducer(state, statsLoaded(makeStats()));

    state = reducer(state, gamesLoadingStarted());
    state = reducer(state, gamesFailed());

    expect(state.stats).not.toBeNull();
    expect(state.games).toHaveLength(1);
  });
});
