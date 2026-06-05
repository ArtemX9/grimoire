import { Mood, Platform } from '@grimoire/shared';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const AI_TOGGLE_MOOD = 'ai/TOGGLE_MOOD';
export const AI_SET_SESSION_LENGTH = 'ai/SET_SESSION_LENGTH';
export const AI_APPEND_TOKEN = 'ai/APPEND_TOKEN';
export const AI_APPEND_THOUGHT = 'ai/APPEND_THOUGHT';
export const AI_START_STREAMING = 'ai/START_STREAMING';
export const AI_STOP_STREAMING = 'ai/STOP_STREAMING';
export const AI_LOAD_RECOMMENDATION = 'ai/LOAD_RECOMMENDATION';
export const AI_SET_DESIRED_PLATFORM = 'ai/SET_DESIRED_PLATFORM';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const toggleMood = (mood: Mood) => ({ type: AI_TOGGLE_MOOD, payload: { mood } });
export const setSessionLength = (minutes: number) => ({ type: AI_SET_SESSION_LENGTH, payload: { minutes } });
export const appendToken = (token: string) => ({ type: AI_APPEND_TOKEN, payload: { token } });
export const appendThought = (thought: string) => ({ type: AI_APPEND_THOUGHT, payload: { thought } });
export const startStreaming = () => ({ type: AI_START_STREAMING, payload: {} });
export const stopStreaming = () => ({ type: AI_STOP_STREAMING, payload: {} });
export const loadRecommendation = (recommendation: string) => ({ type: AI_LOAD_RECOMMENDATION, payload: { recommendation } });
export const setDesiredPlatform = (platform: Platform | undefined) => ({ type: AI_SET_DESIRED_PLATFORM, payload: { platform } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type AiAction =
  | ReturnType<typeof toggleMood>
  | ReturnType<typeof setSessionLength>
  | ReturnType<typeof appendToken>
  | ReturnType<typeof appendThought>
  | ReturnType<typeof startStreaming>
  | ReturnType<typeof stopStreaming>
  | ReturnType<typeof loadRecommendation>
  | ReturnType<typeof setDesiredPlatform>;
