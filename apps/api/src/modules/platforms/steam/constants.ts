export const PLATFORM_ID_STEAM = 1;
export const GET_STEAM_IMAGE_LINK = (appID: number, iconHash: string) =>
  `https://media.steampowered.com/steamcommunity/public/images/apps/${appID}/${iconHash}.jpg`;
