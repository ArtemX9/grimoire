import { Genre, Mood, Theme, ToolName } from '../constants';

export type RecommendationContext = {
  moods: string[]
  sessionLengthMinutes: number
  games: Array<{
    gameID: string;
    title: string;
    status: string;
    genres: Genre[];
    playtimeHours: number;
    moods: Mood[];
    themes: Theme[];
    summary?: string;
    rating?: number;
  }>
  recentSessions: Array<{
    gameTitle: string;
    durationMin: number;
    mood: Mood[];
    startedAt: Date;
    notes?: string;
  }>
}

export enum AI_RESPONSE_TYPE {
  TOOL_CALL = 'toolCall', TEXT = 'text', ERROR = 'error',
}

export type RecommendationResponseText = {
  text: string;
}

export type RecommendationResponseToolCall = {
  name: ToolName,
  arguments: Record<string, any>
}

export type RecommendationResponseError = {
  error: string,
}

export type RecommendationMessage = | ({
  type: AI_RESPONSE_TYPE.TOOL_CALL
} & RecommendationResponseToolCall) | ({
  type: AI_RESPONSE_TYPE.TEXT
} & RecommendationResponseText) | ({
  type: AI_RESPONSE_TYPE.ERROR
} & RecommendationResponseError);
