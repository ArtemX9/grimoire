import { Platform } from './platform';

export type PlatformUpdateResponse = {
  id: Platform,
  token: string,
  dateSet: Date,
  tokenValidityFrame: number
};

export type PlatformsTokensResponse = {
  id: Platform,
  token: string,
  dateSet: Date,
  tokenValidityFrame: number
}[];
