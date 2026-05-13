import { describe, expect, it } from 'vitest';

import { unmappedGameKeys } from './unmappedGames';

describe('unmappedGameKeys', () => {
  it('all() returns the base key array', () => {
    expect(unmappedGameKeys.all()).toEqual(['unmapped-games']);
  });

  it('list() with no params returns a key prefixed by all()', () => {
    const listKey = unmappedGameKeys.list();
    const allKey = unmappedGameKeys.all();

    expect(listKey[0]).toBe(allKey[0]);
  });

  it('list() with params returns a key prefixed by all()', () => {
    const listKey = unmappedGameKeys.list({ limit: 10, offset: 0 });
    const allKey = unmappedGameKeys.all();

    expect(listKey[0]).toBe(allKey[0]);
  });

  it('all() is a prefix of list() — setQueriesData with all() matches list() entries', () => {
    // The mutation uses queryKey: unmappedGameKeys.all() with setQueriesData,
    // which matches any query whose key starts with ['unmapped-games'].
    // Verify that list() keys always start with the same string as all().
    const allKey = unmappedGameKeys.all();
    const listNoParams = unmappedGameKeys.list();
    const listWithParams = unmappedGameKeys.list({ limit: 5 });

    expect(listNoParams).toEqual(expect.arrayContaining([allKey[0]]));
    expect(listWithParams).toEqual(expect.arrayContaining([allKey[0]]));
  });

  it('list() without params differs from list() with params', () => {
    const withoutParams = unmappedGameKeys.list();
    const withParams = unmappedGameKeys.list({ limit: 10 });

    expect(withoutParams).not.toEqual(withParams);
  });
});
