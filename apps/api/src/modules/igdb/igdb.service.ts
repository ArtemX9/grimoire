import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IgdbGame, IgdbGameRaw } from '@grimoire/shared';

@Injectable()
export class IgdbService implements OnModuleInit {
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const clientId = this.config.get<string>('app.igdb.clientId');
    const clientSecret = this.config.get<string>('app.igdb.clientSecret');
    if (!clientId || !clientSecret) return;
    await this.refreshToken();
  }

  async search(query: string, limit = 10): Promise<IgdbGame[]> {
    const headers = await this.getHeaders();
    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `search "${query}"; fields id,name,cover.url,genres.name,summary,storyline,first_release_date,total_rating; limit ${limit};`,
    });
    const games: IgdbGameRaw[] = await res.json();
    if (!Array.isArray(games)) return [];
    return games.map((game) => ({
      ...game,
      genres: game.genres?.map((genre) => genre.name),
      cover: 'https:' + game.cover?.url.replace('thumb', 'cover_big_2x'),
    }));
  }

  async findById(id: number): Promise<IgdbGame | undefined> {
    const headers = await this.getHeaders();
    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers,
      body: `where id = ${id}; fields id,name,cover.url,genres.name,summary,storyline,first_release_date,total_rating;`,
    });
    const data: IgdbGameRaw[] = await res.json();
    if (!Array.isArray(data) || !data[0]) return undefined;
    const game = { ...data[0] } as IgdbGame;
    if (!!data[0]) {
      game.genres = data[0].genres?.map((genre) => genre?.name) ?? [];
      game.cover = 'https:' + data[0].cover?.url.replace('thumb', 'cover_big_2x');
      return game;
    }
    return undefined;
  }

  private async refreshToken() {
    const clientId = this.config.get('app.igdb.clientId');
    const clientSecret = this.config.get('app.igdb.clientSecret');
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' },
    );
    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
  }

  private async getHeaders() {
    if (Date.now() >= this.tokenExpiry) await this.refreshToken();
    return {
      'Client-ID': this.config.get('app.igdb.clientId')!,
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'text/plain',
    };
  }
}
