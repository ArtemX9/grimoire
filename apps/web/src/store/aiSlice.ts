import { Mood } from '@grimoire/shared';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const AI_SLICE = 'ai';

export interface AiState {
  selectedMoods: Mood[];
  sessionLengthMinutes: number;
  streamedTokens: string;
  isStreaming: boolean;
}

const initialState: AiState = {
  selectedMoods: [],
  sessionLengthMinutes: 120,
  streamedTokens: '',
  isStreaming: false,
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
    startStreaming: (state) => {
      state.streamedTokens = '';
      state.isStreaming = true;
    },
    stopStreaming: (state) => {
      state.isStreaming = false;
    },
  },
});

export const { toggleMood, setSessionLength, appendToken, startStreaming, stopStreaming } = aiSlice.actions;

export default aiSlice.reducer;
