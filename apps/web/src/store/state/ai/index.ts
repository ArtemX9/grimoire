import { Mood, Platform } from '@grimoire/shared';

import {
  AI_APPEND_THOUGHT,
  AI_APPEND_TOKEN,
  AI_LOAD_RECOMMENDATION,
  AI_SET_DESIRED_PLATFORM,
  AI_SET_SESSION_LENGTH,
  AI_START_STREAMING,
  AI_STOP_STREAMING,
  AI_TOGGLE_MOOD,
  type AiAction,
  appendThought,
  appendToken,
  loadRecommendation,
  setDesiredPlatform,
  setSessionLength,
  startStreaming,
  stopStreaming,
  toggleMood,
} from '@/store/actions/ai';

export {
  appendThought,
  appendToken,
  loadRecommendation,
  setDesiredPlatform,
  setSessionLength,
  startStreaming,
  stopStreaming,
  toggleMood,
} from '@/store/actions/ai';

export const AI_SLICE = 'ai';

export const AI_LAST_RECOMMENDATION_KEY = 'grimoire:ai:lastRecommendation';

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

export function aiReducer(state = initialState, action: AiAction): AiState {
  switch (action.type) {
    // toggleMood
    case AI_TOGGLE_MOOD:
      return handleAiToggleMood(state, action as ReturnType<typeof toggleMood>);

    // setSessionLength
    case AI_SET_SESSION_LENGTH:
      return handleAiSetSessionLength(state, action as ReturnType<typeof setSessionLength>);

    // appendToken
    case AI_APPEND_TOKEN:
      return handleAiAppendToken(state, action as ReturnType<typeof appendToken>);

    // appendThought
    case AI_APPEND_THOUGHT:
      return handleAiAppendThought(state, action as ReturnType<typeof appendThought>);

    // startStreaming
    case AI_START_STREAMING:
      return handleAiStartStreaming(state, action as ReturnType<typeof startStreaming>);

    // stopStreaming
    case AI_STOP_STREAMING:
      return handleAiStopStreaming(state, action as ReturnType<typeof stopStreaming>);

    // loadRecommendation
    case AI_LOAD_RECOMMENDATION:
      return handleAiLoadRecommendation(state, action as ReturnType<typeof loadRecommendation>);

    // setDesiredPlatform
    case AI_SET_DESIRED_PLATFORM:
      return handleAiSetDesiredPlatform(state, action as ReturnType<typeof setDesiredPlatform>);

    default:
      return state;
  }
}

// toggleMood
function handleAiToggleMood(state: AiState, action: ReturnType<typeof toggleMood>): AiState {
  const idx = state.selectedMoods.indexOf(action.payload.mood);
  if (idx >= 0) {
    return { ...state, selectedMoods: state.selectedMoods.filter((_, i) => i !== idx) };
  }
  return { ...state, selectedMoods: [...state.selectedMoods, action.payload.mood] };
}

// setSessionLength
function handleAiSetSessionLength(state: AiState, action: ReturnType<typeof setSessionLength>): AiState {
  return { ...state, sessionLengthMinutes: action.payload.minutes };
}

// appendToken
function handleAiAppendToken(state: AiState, action: ReturnType<typeof appendToken>): AiState {
  return { ...state, streamedTokens: state.streamedTokens + action.payload.token };
}

// appendThought
function handleAiAppendThought(state: AiState, action: ReturnType<typeof appendThought>): AiState {
  return { ...state, streamedThoughts: state.streamedThoughts + action.payload.thought };
}

// startStreaming
function handleAiStartStreaming(state: AiState, _action: ReturnType<typeof startStreaming>): AiState {
  return { ...state, streamedTokens: '', streamedThoughts: '', isStreaming: true };
}

// stopStreaming
function handleAiStopStreaming(state: AiState, _action: ReturnType<typeof stopStreaming>): AiState {
  return { ...state, isStreaming: false };
}

// loadRecommendation
function handleAiLoadRecommendation(state: AiState, action: ReturnType<typeof loadRecommendation>): AiState {
  return { ...state, streamedTokens: action.payload.recommendation };
}

// setDesiredPlatform
function handleAiSetDesiredPlatform(state: AiState, action: ReturnType<typeof setDesiredPlatform>): AiState {
  return { ...state, desiredPlatform: action.payload.platform };
}

export default aiReducer;
