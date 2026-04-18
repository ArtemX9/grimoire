import { PlatformType } from './platform';

export type UnmappedGame = {
  id: string,
  syncedGameID: string,
  isMapped: boolean,
  createdAt: Date,
  updatedAt: Date,
  reason: string,
  platform: PlatformType,
  syncedGameTitle: string,
}

export type MappedGame = {
  id: string,
  syncedGameID: string,
  isMapped: boolean,
  createdAt: Date,
  updatedAt: Date,
  reason: string,
  platform: PlatformType,
  syncedGameTitle: string,
  userGameID: string,
}
