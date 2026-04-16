import { faker } from '@faker-js/faker';
import { Mood, PlaySession } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// PlaySession (shared type)
// ---------------------------------------------------------------------------

export interface IGeneratePlaySession {
  id?: string;
  userID?: string;
  gameID?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationMin?: number;
  mood?: Mood[];
  notes?: string;
}

export function generatePlaySession(params: IGeneratePlaySession = {}): PlaySession {
  return {
    id: params.id ?? faker.string.uuid(),
    userID: params.userID ?? faker.string.uuid(),
    gameID: params.gameID ?? faker.string.uuid(),
    startedAt: params.startedAt ?? faker.date.recent(),
    endedAt: params.endedAt,
    durationMin: params.durationMin,
    mood: params.mood ?? [],
    notes: params.notes,
  };
}
