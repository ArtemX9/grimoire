import { GameStatus, Genre, Mood, UpdateGameSchema } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// UpdateGameSchema — defaults regression
//
// Regression guard: CreateGameSchema carries .default() on status/genres/moods.
// UpdateGameSchema must override those with plain .optional() so Zod never
// injects BACKLOG / [] into a PATCH body that omits those fields.
// ---------------------------------------------------------------------------

describe('UpdateGameSchema — omitted fields carry no defaults', () => {
  it('does not inject BACKLOG when status is absent from the request body', () => {
    const result = UpdateGameSchema.parse({ userRating: 5 });
    expect(result.status).toBeUndefined();
  });

  it('does not inject an empty array when genres is absent from the request body', () => {
    const result = UpdateGameSchema.parse({ userRating: 5 });
    expect(result.genres).toBeUndefined();
  });

  it('does not inject an empty array when moods is absent from the request body', () => {
    const result = UpdateGameSchema.parse({ userRating: 5 });
    expect(result.moods).toBeUndefined();
  });

  it('parses an empty body without injecting any field defaults', () => {
    const result = UpdateGameSchema.parse({});
    expect(result.status).toBeUndefined();
    expect(result.genres).toBeUndefined();
    expect(result.moods).toBeUndefined();
  });
});

describe('UpdateGameSchema — explicitly provided values are preserved', () => {
  it('uses the provided status value, not the create-schema default', () => {
    const result = UpdateGameSchema.parse({ status: GameStatus.PLAYING });
    expect(result.status).toBe(GameStatus.PLAYING);
  });

  it('uses the provided genres array', () => {
    const result = UpdateGameSchema.parse({ genres: [Genre.RPG] });
    expect(result.genres).toEqual([Genre.RPG]);
  });

  it('uses the provided moods array', () => {
    const result = UpdateGameSchema.parse({ moods: [Mood.CHILL] });
    expect(result.moods).toEqual([Mood.CHILL]);
  });

  it('preserves the provided userRating', () => {
    const result = UpdateGameSchema.parse({ userRating: 8 });
    expect(result.userRating).toBe(8);
  });

  it('accepts a combined partial update without polluting omitted fields', () => {
    const result = UpdateGameSchema.parse({ userRating: 7, status: GameStatus.COMPLETED });
    expect(result.userRating).toBe(7);
    expect(result.status).toBe(GameStatus.COMPLETED);
    expect(result.genres).toBeUndefined();
    expect(result.moods).toBeUndefined();
  });
});
