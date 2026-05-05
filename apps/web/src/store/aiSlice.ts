import { Mood, Platform } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const AI_SLICE = 'ai';

export const AI_LAST_RECOMMENDATION_KEY = 'grimoire:ai:lastRecommendation';

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

const aiSlice = createSlice({
  name: AI_SLICE,
  initialState,
  reducers: {
    toggleMood: (state, action: PayloadAction<Mood>) => {
      const idx = state.selectedMoods.indexOf(action.payload);
      if (idx >= 0) {
        state.selectedMoods.splice(idx, 1);
      } else {
        state.selectedMoods.push(action.payload);
      }
    },
    setSessionLength: (state, action: PayloadAction<number>) => {
      state.sessionLengthMinutes = action.payload;
    },
    appendToken: (state, action: PayloadAction<string>) => {
      state.streamedTokens += action.payload;
    },
    appendThought: (state, action: PayloadAction<string>) => {
      state.streamedThoughts += action.payload;
    },
    startStreaming: (state) => {
      state.streamedTokens = '';
      state.streamedThoughts = '';
      state.isStreaming = true;
    },
    stopStreaming: (state) => {
      state.isStreaming = false;
    },
    loadRecommendation: (state, action: PayloadAction<string>) => {
      state.streamedTokens = action.payload;
    },
    setDesiredPlatform: (state, action: PayloadAction<Platform | undefined>) => {
      state.desiredPlatform = action.payload;
    },
  },
});

export const { toggleMood, setSessionLength, appendToken, appendThought, startStreaming, stopStreaming, loadRecommendation, setDesiredPlatform } = aiSlice.actions;

export default aiSlice.reducer;
