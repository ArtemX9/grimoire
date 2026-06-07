import { MapUnmappedGameSchemaDto } from '@grimoire/shared';

export type GetUnmappedGamesArgs = {
  limit?: number;
  offset?: number;
};

export type MapUnmappedGameArgs = {
  id: string;
  body: MapUnmappedGameSchemaDto;
};

export type DeleteUnmappedGameArgs = string;
