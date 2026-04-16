import { faker } from '@faker-js/faker';

import { CreateSessionDto, Mood } from '@grimoire/shared';

import { SessionResponse, SessionWithGameResponse } from '../modules/sessions/sessions.types';

export interface IGenerateSession {
  id?: string;
  userId?: string;
  gameId?: string;
  startedAt?: Date;
  durationMin?: number;
  mood?: Mood[];
  notes?: string;
}

export function generateSession(params: IGenerateSession = {}): SessionResponse {
  return {
    id: params.id ?? faker.string.uuid(),
    userId: params.userId ?? faker.string.uuid(),
    gameId: params.gameId ?? faker.string.uuid(),
    startedAt: params.startedAt ?? faker.date.recent(),
    durationMin: params.durationMin,
    mood: params.mood ?? [],
    notes: params.notes,
  };
}

export interface IGenerateSessionWithGame extends IGenerateSession {
  gameTitle?: string;
}

export function generateSessionWithGame(params: IGenerateSessionWithGame = {}): SessionWithGameResponse {
  return {
    ...generateSession(params),
    game: { title: params.gameTitle ?? faker.commerce.productName() },
  };
}

export interface IGenerateCreateSessionDto {
  id?: string;
  startedAt?: Date;
  durationMin?: number;
  mood?: Mood[];
  notes?: string;
}

export function generateCreateSessionDto(params: IGenerateCreateSessionDto = {}): CreateSessionDto {
  return {
    gameID: params.id ?? faker.string.uuid(),
    startedAt: params.startedAt ?? faker.date.recent(),
    durationMin: params.durationMin,
    mood: params.mood ?? [],
    notes: params.notes,
  };
}
