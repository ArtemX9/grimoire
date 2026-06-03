import { Mood, Platform } from '@grimoire/shared';

export const AI_SLICE = 'ai';

export const AI_LAST_RECOMMENDATION_KEY = 'grimoire:ai:lastRecommendation';

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

export const toggleMood = (payload: Mood) => ({ type: AI_TOGGLE_MOOD, payload }) as const;
export const setSessionLength = (payload: number) => ({ type: AI_SET_SESSION_LENGTH, payload }) as const;
export const appendToken = (payload: string) => ({ type: AI_APPEND_TOKEN, payload }) as const;
export const appendThought = (payload: string) => ({ type: AI_APPEND_THOUGHT, payload }) as const;
export const startStreaming = () => ({ type: AI_START_STREAMING }) as const;
export const stopStreaming = () => ({ type: AI_STOP_STREAMING }) as const;
export const loadRecommendation = (payload: string) => ({ type: AI_LOAD_RECOMMENDATION, payload }) as const;
export const setDesiredPlatform = (payload: Platform | undefined) => ({ type: AI_SET_DESIRED_PLATFORM, payload }) as const;

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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface AiState {
  selectedMoods: Mood[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  streamedThoughts: string;
  isStreaming: boolean;
  desiredPlatform: Platform | undefined;
}

const initialState: AiState = {
  selectedMoods: [],
  sessionLengthMinutes: 120,
  streamedTokens: '',
  streamedThoughts: '',
  isStreaming: false,
  desiredPlatform: undefined,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function aiReducer(state = initialState, rawAction: any): AiState {
  const action = rawAction as AiAction;
  switch (action.type) {
    case AI_TOGGLE_MOOD: {
      const idx = state.selectedMoods.indexOf(action.payload);
      if (idx >= 0) {
        return {
          ...state,
          selectedMoods: state.selectedMoods.filter((_, i) => i !== idx),
        };
      }
      return { ...state, selectedMoods: [...state.selectedMoods, action.payload] };
    }
    case AI_SET_SESSION_LENGTH:
      return { ...state, sessionLengthMinutes: action.payload };
    case AI_APPEND_TOKEN:
      return { ...state, streamedTokens: state.streamedTokens + action.payload };
    case AI_APPEND_THOUGHT:
      return { ...state, streamedThoughts: state.streamedThoughts + action.payload };
    case AI_START_STREAMING:
      return { ...state, streamedTokens: '', streamedThoughts: '', isStreaming: true };
    case AI_STOP_STREAMING:
      return { ...state, isStreaming: false };
    case AI_LOAD_RECOMMENDATION:
      return { ...state, streamedTokens: action.payload };
    case AI_SET_DESIRED_PLATFORM:
      return { ...state, desiredPlatform: action.payload };
    default:
      return state;
  }
}

export default aiReducer;
