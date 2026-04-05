export enum Platform {
  STEAM = 'STEAM',
  PSN = 'PSN',
  XBOX = 'XBOX',
  EPIC = 'EPIC',
  RETROACHIEVEMENTS = 'RETROACHIEVEMENTS',
  MANUAL = 'MANUAL',
}

export interface UserPlatform {
  id: string
  userID: string
  platform: Platform
  externalID: string
  lastSyncAt?: Date
}

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  img_icon_url: string
}
