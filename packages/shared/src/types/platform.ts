export enum Platform {
  STEAM = 'STEAM', PlayStation = 'PlayStation', Xbox = 'Xbox', PC = 'PC',
}

export type UserPlatform = {
  id: string;
  userID: string;
  platform: PlatformType;
  externalID: string;
  lastSyncAt?: Date;
}

export type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
}

export type PlatformType = {
  id: number;
  platform: Platform
};
