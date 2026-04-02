import { Role } from '@grimoire/shared';
import { describe, expect, it } from 'vitest';

import type { AdminStats, AdminUserRow, AiGlobalSettings } from '@/api/adminApi';
import reducer, {
  aiSettingsFailed,
  aiSettingsLoaded,
  aiSettingsLoadingStarted,
  aiSettingsPatched,
  statsFailed,
  statsLoaded,
  statsLoadingStarted,
  userAdded,
  userPatched,
  userRemoved,
  usersFailed,
  usersLoaded,
  usersLoadingStarted,
} from '@/store/adminSlice';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState = reducer(undefined, { type: '@@INIT' });

function makeUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 'user-1',
    email: 'alice@grimoire.app',
    name: 'Alice',
    role: Role.USER,
    plan: 'free',
    mustChangePassword: false,
    aiEnabled: true,
    aiRequestsUsed: 0,
    aiRequestsLimit: 10,
    gamesCount: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeStats(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    users: [
      {
        id: 'user-1',
        email: 'alice@grimoire.app',
        name: 'Alice',
        gamesCount: 5,
        sessionsCount: 3,
        aiRequestsUsed: 2,
        aiRequestsLimit: 10,
      },
    ],
    ...overrides,
  };
}

function makeAiSettings(overrides: Partial<AiGlobalSettings> = {}): AiGlobalSettings {
  return {
    aiEnabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('adminSlice — initial state', () => {
  it('has empty users array', () => {
    expect(initialState.users).toEqual([]);
  });

  it('has usersTotal of 0', () => {
    expect(initialState.usersTotal).toBe(0);
  });

  it('users loading flag is false', () => {
    expect(initialState.isUsersLoading).toBe(false);
  });

  it('stats is null', () => {
    expect(initialState.stats).toBeNull();
  });

  it('stats loading flag is false', () => {
    expect(initialState.isStatsLoading).toBe(false);
  });

  it('aiSettings is null', () => {
    expect(initialState.aiSettings).toBeNull();
  });

  it('aiSettings loading flag is false', () => {
    expect(initialState.isAiSettingsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — usersLoadingStarted
// ---------------------------------------------------------------------------

describe('adminSlice — usersLoadingStarted', () => {
  it('sets isUsersLoading to true', () => {
    const next = reducer(initialState, usersLoadingStarted());
    expect(next.isUsersLoading).toBe(true);
  });

  it('does not affect stats or aiSettings loading flags', () => {
    const next = reducer(initialState, usersLoadingStarted());
    expect(next.isStatsLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });

  it('does not clear existing users while loading', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const next = reducer(withUsers, usersLoadingStarted());
    expect(next.users).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — usersLoaded
// ---------------------------------------------------------------------------

describe('adminSlice — usersLoaded', () => {
  it('stores the users array and total, and clears loading flag', () => {
    const users = [makeUser(), makeUser({ id: 'user-2', email: 'bob@grimoire.app' })];
    const loading = reducer(initialState, usersLoadingStarted());
    const next = reducer(loading, usersLoaded({ data: users, total: 2 }));

    expect(next.users).toEqual(users);
    expect(next.usersTotal).toBe(2);
    expect(next.isUsersLoading).toBe(false);
  });

  it('stores an empty array when no users are returned', () => {
    const loading = reducer(initialState, usersLoadingStarted());
    const next = reducer(loading, usersLoaded({ data: [], total: 0 }));

    expect(next.users).toEqual([]);
    expect(next.usersTotal).toBe(0);
    expect(next.isUsersLoading).toBe(false);
  });

  it('replaces the previous users array entirely', () => {
    const first = reducer(initialState, usersLoaded({ data: [makeUser({ id: 'user-old' })], total: 1 }));
    const next = reducer(first, usersLoaded({ data: [makeUser({ id: 'user-new' })], total: 1 }));

    expect(next.users).toHaveLength(1);
    expect(next.users[0].id).toBe('user-new');
  });

  it('does not affect stats or aiSettings', () => {
    const withStats = reducer(initialState, statsLoaded(makeStats()));
    const withAi = reducer(withStats, aiSettingsLoaded(makeAiSettings()));
    const next = reducer(withAi, usersLoaded({ data: [makeUser()], total: 1 }));

    expect(next.stats).not.toBeNull();
    expect(next.aiSettings).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — usersFailed
// ---------------------------------------------------------------------------

describe('adminSlice — usersFailed', () => {
  it('clears isUsersLoading on failure', () => {
    const loading = reducer(initialState, usersLoadingStarted());
    const next = reducer(loading, usersFailed());

    expect(next.isUsersLoading).toBe(false);
  });

  it('does not wipe existing users already in state', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const loading = reducer(withUsers, usersLoadingStarted());
    const next = reducer(loading, usersFailed());

    expect(next.users).toHaveLength(1);
  });

  it('does not affect stats or aiSettings loading flags', () => {
    const loading = reducer(initialState, usersLoadingStarted());
    const next = reducer(loading, usersFailed());

    expect(next.isStatsLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — userRemoved
// ---------------------------------------------------------------------------

describe('adminSlice — userRemoved', () => {
  it('removes the user from the list by id', () => {
    const target = makeUser({ id: 'user-1' });
    const bystander = makeUser({ id: 'user-2', email: 'bob@grimoire.app' });
    let state = reducer(initialState, usersLoaded({ data: [target, bystander], total: 2 }));
    state = reducer(state, userRemoved('user-1'));

    expect(state.users.map((u) => u.id)).not.toContain('user-1');
    expect(state.users).toHaveLength(1);
  });

  it('decrements usersTotal by 1', () => {
    const state = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const next = reducer(state, userRemoved('user-1'));

    expect(next.usersTotal).toBe(0);
  });

  it('does not let usersTotal go below 0', () => {
    const next = reducer(initialState, userRemoved('ghost-id'));

    expect(next.usersTotal).toBe(0);
  });

  it('does not touch other users in the list', () => {
    const target = makeUser({ id: 'user-1' });
    const bystander = makeUser({ id: 'user-2', email: 'bob@grimoire.app' });
    let state = reducer(initialState, usersLoaded({ data: [target, bystander], total: 2 }));
    state = reducer(state, userRemoved('user-1'));

    expect(state.users[0].id).toBe('user-2');
  });

  it('is safe when the id is not found (no-op)', () => {
    const state = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const next = reducer(state, userRemoved('ghost-id'));

    expect(next.users).toHaveLength(1);
  });

  it('removing from an empty list does not throw', () => {
    const next = reducer(initialState, userRemoved('ghost-id'));

    expect(next.users).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — userAdded
// ---------------------------------------------------------------------------

describe('adminSlice — userAdded', () => {
  it('prepends the new user to the list', () => {
    const existing = makeUser({ id: 'user-1' });
    const created = makeUser({ id: 'user-2', email: 'new@grimoire.app' });
    let state = reducer(initialState, usersLoaded({ data: [existing], total: 1 }));
    state = reducer(state, userAdded(created));

    expect(state.users[0].id).toBe('user-2');
    expect(state.users).toHaveLength(2);
  });

  it('increments usersTotal by 1', () => {
    const state = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const next = reducer(state, userAdded(makeUser({ id: 'user-2', email: 'new@grimoire.app' })));

    expect(next.usersTotal).toBe(2);
  });

  it('adding to an empty list results in a single-item list', () => {
    const next = reducer(initialState, userAdded(makeUser()));

    expect(next.users).toHaveLength(1);
    expect(next.usersTotal).toBe(1);
  });

  it('does not affect stats or aiSettings', () => {
    const withStats = reducer(initialState, statsLoaded(makeStats()));
    const withAi = reducer(withStats, aiSettingsLoaded(makeAiSettings()));
    const next = reducer(withAi, userAdded(makeUser()));

    expect(next.stats).not.toBeNull();
    expect(next.aiSettings).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Users sub-domain — userPatched
// ---------------------------------------------------------------------------

describe('adminSlice — userPatched', () => {
  it('updates the matching user in the list', () => {
    const original = makeUser({ id: 'user-1', plan: 'free' });
    const state = reducer(initialState, usersLoaded({ data: [original], total: 1 }));
    const patched = makeUser({ id: 'user-1', plan: 'pro' });
    const next = reducer(state, userPatched(patched));

    expect(next.users[0].plan).toBe('pro');
  });

  it('does not affect other users in the list', () => {
    const target = makeUser({ id: 'user-1', plan: 'free' });
    const bystander = makeUser({ id: 'user-2', email: 'bob@grimoire.app', plan: 'free' });
    let state = reducer(initialState, usersLoaded({ data: [target, bystander], total: 2 }));
    state = reducer(state, userPatched(makeUser({ id: 'user-1', plan: 'pro' })));

    const bystanderInList = state.users.find((u) => u.id === 'user-2');
    expect(bystanderInList?.plan).toBe('free');
  });

  it('is safe when the id is not found in the list (no-op)', () => {
    const state = reducer(initialState, usersLoaded({ data: [makeUser({ id: 'user-1' })], total: 1 }));
    const next = reducer(state, userPatched(makeUser({ id: 'ghost-id', plan: 'pro' })));

    expect(next.users).toHaveLength(1);
    expect(next.users[0].id).toBe('user-1');
  });

  it('can update aiEnabled flag on a user', () => {
    const user = makeUser({ id: 'user-1', aiEnabled: true });
    const state = reducer(initialState, usersLoaded({ data: [user], total: 1 }));
    const patched = makeUser({ id: 'user-1', aiEnabled: false });
    const next = reducer(state, userPatched(patched));

    expect(next.users[0].aiEnabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stats sub-domain — statsLoadingStarted
// ---------------------------------------------------------------------------

describe('adminSlice — statsLoadingStarted', () => {
  it('sets isStatsLoading to true', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isStatsLoading).toBe(true);
  });

  it('does not affect users or aiSettings loading flags', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isUsersLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stats sub-domain — statsLoaded
// ---------------------------------------------------------------------------

describe('adminSlice — statsLoaded', () => {
  it('stores stats and clears loading flag', () => {
    const stats = makeStats();
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsLoaded(stats));

    expect(next.stats).toEqual(stats);
    expect(next.isStatsLoading).toBe(false);
  });

  it('overwrites previous stats', () => {
    const first = reducer(initialState, statsLoaded(makeStats({ users: [] })));
    const next = reducer(first, statsLoaded(makeStats({ users: [{ id: 'u-99', email: 'x@x.com', gamesCount: 9, sessionsCount: 1, aiRequestsUsed: 0, aiRequestsLimit: null }] })));

    expect(next.stats?.users).toHaveLength(1);
    expect(next.stats?.users[0].id).toBe('u-99');
  });

  it('stores stats with an empty users array', () => {
    const stats = makeStats({ users: [] });
    const next = reducer(initialState, statsLoaded(stats));

    expect(next.stats?.users).toEqual([]);
    expect(next.isStatsLoading).toBe(false);
  });

  it('does not affect users list or aiSettings', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const withAi = reducer(withUsers, aiSettingsLoaded(makeAiSettings()));
    const next = reducer(withAi, statsLoaded(makeStats()));

    expect(next.users).toHaveLength(1);
    expect(next.aiSettings).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Stats sub-domain — statsFailed
// ---------------------------------------------------------------------------

describe('adminSlice — statsFailed', () => {
  it('clears isStatsLoading on failure', () => {
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.isStatsLoading).toBe(false);
  });

  it('does not wipe existing stats already in state', () => {
    const withStats = reducer(initialState, statsLoaded(makeStats()));
    const loading = reducer(withStats, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.stats).not.toBeNull();
  });

  it('does not affect users or aiSettings loading flags', () => {
    const loading = reducer(initialState, statsLoadingStarted());
    const next = reducer(loading, statsFailed());

    expect(next.isUsersLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AI settings sub-domain — aiSettingsLoadingStarted
// ---------------------------------------------------------------------------

describe('adminSlice — aiSettingsLoadingStarted', () => {
  it('sets isAiSettingsLoading to true', () => {
    const next = reducer(initialState, aiSettingsLoadingStarted());
    expect(next.isAiSettingsLoading).toBe(true);
  });

  it('does not affect users or stats loading flags', () => {
    const next = reducer(initialState, aiSettingsLoadingStarted());
    expect(next.isUsersLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AI settings sub-domain — aiSettingsLoaded
// ---------------------------------------------------------------------------

describe('adminSlice — aiSettingsLoaded', () => {
  it('stores aiSettings and clears loading flag', () => {
    const settings = makeAiSettings({ aiEnabled: false });
    const loading = reducer(initialState, aiSettingsLoadingStarted());
    const next = reducer(loading, aiSettingsLoaded(settings));

    expect(next.aiSettings).toEqual(settings);
    expect(next.isAiSettingsLoading).toBe(false);
  });

  it('overwrites previous aiSettings', () => {
    const first = reducer(initialState, aiSettingsLoaded(makeAiSettings({ aiEnabled: true })));
    const next = reducer(first, aiSettingsLoaded(makeAiSettings({ aiEnabled: false })));

    expect(next.aiSettings?.aiEnabled).toBe(false);
  });

  it('does not affect users or stats', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const withStats = reducer(withUsers, statsLoaded(makeStats()));
    const next = reducer(withStats, aiSettingsLoaded(makeAiSettings()));

    expect(next.users).toHaveLength(1);
    expect(next.stats).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AI settings sub-domain — aiSettingsFailed
// ---------------------------------------------------------------------------

describe('adminSlice — aiSettingsFailed', () => {
  it('clears isAiSettingsLoading on failure', () => {
    const loading = reducer(initialState, aiSettingsLoadingStarted());
    const next = reducer(loading, aiSettingsFailed());

    expect(next.isAiSettingsLoading).toBe(false);
  });

  it('does not wipe existing aiSettings already in state', () => {
    const withSettings = reducer(initialState, aiSettingsLoaded(makeAiSettings()));
    const loading = reducer(withSettings, aiSettingsLoadingStarted());
    const next = reducer(loading, aiSettingsFailed());

    expect(next.aiSettings).not.toBeNull();
  });

  it('does not affect users or stats loading flags', () => {
    const loading = reducer(initialState, aiSettingsLoadingStarted());
    const next = reducer(loading, aiSettingsFailed());

    expect(next.isUsersLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AI settings sub-domain — aiSettingsPatched
// ---------------------------------------------------------------------------

describe('adminSlice — aiSettingsPatched', () => {
  it('updates aiSettings in place without clearing loading state', () => {
    const withSettings = reducer(initialState, aiSettingsLoaded(makeAiSettings({ aiEnabled: true })));
    const next = reducer(withSettings, aiSettingsPatched({ aiEnabled: false }));

    expect(next.aiSettings?.aiEnabled).toBe(false);
  });

  it('sets aiSettings when it was previously null', () => {
    const next = reducer(initialState, aiSettingsPatched({ aiEnabled: true }));

    expect(next.aiSettings?.aiEnabled).toBe(true);
  });

  it('does not affect users or stats', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const withStats = reducer(withUsers, statsLoaded(makeStats()));
    const next = reducer(withStats, aiSettingsPatched({ aiEnabled: false }));

    expect(next.users).toHaveLength(1);
    expect(next.stats).not.toBeNull();
  });

  it('is idempotent — patching with the same value does not change other fields', () => {
    const withUsers = reducer(initialState, usersLoaded({ data: [makeUser()], total: 1 }));
    const withSettings = reducer(withUsers, aiSettingsLoaded(makeAiSettings({ aiEnabled: true })));
    const next = reducer(withSettings, aiSettingsPatched({ aiEnabled: true }));

    expect(next.aiSettings?.aiEnabled).toBe(true);
    expect(next.users).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Sub-domain independence
// ---------------------------------------------------------------------------

describe('adminSlice — sub-domain independence', () => {
  it('loading users does not flip stats or aiSettings loading flags', () => {
    const next = reducer(initialState, usersLoadingStarted());
    expect(next.isStatsLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });

  it('loading stats does not flip users or aiSettings loading flags', () => {
    const next = reducer(initialState, statsLoadingStarted());
    expect(next.isUsersLoading).toBe(false);
    expect(next.isAiSettingsLoading).toBe(false);
  });

  it('loading aiSettings does not flip users or stats loading flags', () => {
    const next = reducer(initialState, aiSettingsLoadingStarted());
    expect(next.isUsersLoading).toBe(false);
    expect(next.isStatsLoading).toBe(false);
  });

  it('all three can be loading simultaneously and resolve independently', () => {
    let state = initialState;
    state = reducer(state, usersLoadingStarted());
    state = reducer(state, statsLoadingStarted());
    state = reducer(state, aiSettingsLoadingStarted());

    expect(state.isUsersLoading).toBe(true);
    expect(state.isStatsLoading).toBe(true);
    expect(state.isAiSettingsLoading).toBe(true);

    state = reducer(state, usersLoaded({ data: [makeUser()], total: 1 }));

    expect(state.isUsersLoading).toBe(false);
    expect(state.isStatsLoading).toBe(true);
    expect(state.isAiSettingsLoading).toBe(true);

    state = reducer(state, statsLoaded(makeStats()));

    expect(state.isUsersLoading).toBe(false);
    expect(state.isStatsLoading).toBe(false);
    expect(state.isAiSettingsLoading).toBe(true);

    state = reducer(state, aiSettingsLoaded(makeAiSettings()));

    expect(state.isUsersLoading).toBe(false);
    expect(state.isStatsLoading).toBe(false);
    expect(state.isAiSettingsLoading).toBe(false);
  });

  it('failure in one sub-domain does not clear data in another', () => {
    let state = initialState;
    state = reducer(state, usersLoaded({ data: [makeUser()], total: 1 }));
    state = reducer(state, statsLoaded(makeStats()));

    state = reducer(state, usersLoadingStarted());
    state = reducer(state, usersFailed());

    expect(state.stats).not.toBeNull();
    expect(state.users).toHaveLength(1);
  });
});
