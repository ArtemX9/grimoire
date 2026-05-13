export type XboxGame = {
  titleId: string;
  pfn: null | string;
  bingId: null | string;
  windowsPhoneProductId: null;
  name: string;
  type: XboxGameType;
  devices: Device[];
  displayImage: string;
  mediaItemType: MediaItemType;
  modernTitleId: string;
  isBundle: boolean;
  achievement: Achievement;
  stats: null;
  gamePass: null;
  images: Image[];
  titleHistory: TitleHistory;
  titleRecord: null;
  detail: null;
  friendsWhoPlayed: null;
  alternateTitleIds: null;
  contentBoards: null;
  xboxLiveTier: XboxLiveTier;
  isStreamable?: boolean;
};

export type Achievement = {
  currentAchievements: number;
  totalAchievements: number;
  currentGamerscore: number;
  totalGamerscore: number;
  progressPercentage: number;
  sourceVersion: number;
};

export enum Device {
  PC = 'PC',
  Xbox360 = 'Xbox360',
  XboxOne = 'XboxOne',
  XboxSeries = 'XboxSeries',
}

export type Image = {
  url: string;
  type: ImageType;
  caption: null | string;
};

export enum ImageType {
  BoxArt = 'BoxArt',
  BrandedKeyArt = 'BrandedKeyArt',
  FeaturePromotionalSquareArt = 'FeaturePromotionalSquareArt',
  Hero = 'Hero',
  Logo = 'Logo',
  Poster = 'Poster',
  Screenshot = 'Screenshot',
  SuperHeroArt = 'SuperHeroArt',
  Tile = 'Tile',
  TitledHeroArt = 'TitledHeroArt',
}

export enum MediaItemType {
  Application = 'Application',
  Xbox360Game = 'Xbox360Game',
  XboxArcadeGame = 'XboxArcadeGame',
  XboxOriginalGame = 'XboxOriginalGame',
}

export type TitleHistory = {
  lastTimePlayed: Date;
  visible: boolean;
  canHide: boolean;
};

export enum XboxGameType {
  Game = 'Game',
}

export enum XboxLiveTier {
  Full = 'Full',
  Open = 'Open',
}
