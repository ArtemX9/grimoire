export enum Platform {
  STEAM = 'STEAM',
  PSN = 'PSN',
  XBOX = 'XBOX',
  EPIC = 'EPIC',
  MANUAL = 'MANUAL',
}

export interface UserPlatform {
  id: string
  userId: string
  platform: Platform
  externalId: string
  lastSyncAt?: Date
}

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  img_icon_url: string
}
