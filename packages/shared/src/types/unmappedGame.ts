import { PlatformType } from './platform';

export type UnmappedGame = {
  id: string,
  syncedGameID: string,
  isMapped: boolean,
  playtimeHours: number,
  createdAt: Date,
  updatedAt: Date,
  reason: string,
  platform: PlatformType,
  syncedGameTitle: string,
  coverURL?: string,
}
