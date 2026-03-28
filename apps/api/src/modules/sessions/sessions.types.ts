export interface SessionResponse {
  id: string;
  userId: string;
  gameId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMin?: number;
  mood: string[];
  notes?: string;
}

export interface SessionWithGameResponse extends SessionResponse {
  game: { title: string };
}
