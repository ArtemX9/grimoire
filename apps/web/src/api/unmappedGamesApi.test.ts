import { describe, expect, it } from 'vitest';

describe('unmappedGamesApi — endpoint registration', () => {
  it('registers getUnmappedGames on unmappedGamesApi.endpoints', async () => {
    const { unmappedGamesApi } = await import('@/api/unmappedGamesApi');

    expect(unmappedGamesApi.endpoints.getUnmappedGames).toBeDefined();
  });

  it('registers mapUnmappedGame on unmappedGamesApi.endpoints', async () => {
    const { unmappedGamesApi } = await import('@/api/unmappedGamesApi');

    expect(unmappedGamesApi.endpoints.mapUnmappedGame).toBeDefined();
  });

  it('exports useGetUnmappedGamesQuery hook', async () => {
    const { useGetUnmappedGamesQuery } = await import('@/api/unmappedGamesApi');

    expect(typeof useGetUnmappedGamesQuery).toBe('function');
  });

  it('exports useMapUnmappedGameMutation hook', async () => {
    const { useMapUnmappedGameMutation } = await import('@/api/unmappedGamesApi');

    expect(typeof useMapUnmappedGameMutation).toBe('function');
  });
});
