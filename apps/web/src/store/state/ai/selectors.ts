import { createSelector } from 'reselect';

import type { RootState } from '@/store/store';

export const selectAiState = (state: RootState) => state.ai;

export const selectSelectedMoods = (state: RootState) => state.ai.selectedMoods;
export const selectSessionLengthMinutes = (state: RootState) => state.ai.sessionLengthMinutes;
export const selectStreamedTokens = (state: RootState) => state.ai.streamedTokens;
export const selectStreamedThoughts = (state: RootState) => state.ai.streamedThoughts;
export const selectIsStreaming = (state: RootState) => state.ai.isStreaming;
export const selectDesiredPlatform = (state: RootState) => state.ai.desiredPlatform;

export const selectCanStream = createSelector(
  selectSelectedMoods,
  selectIsStreaming,
  (moods, isStreaming) => moods.length > 0 && !isStreaming,
);
