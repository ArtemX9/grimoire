import type { RootState } from '@/store/store';

export const selectUiState = (state: RootState) => state.ui;

export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSelectedGameId = (state: RootState) => state.ui.selectedGameId;
export const selectIsAIDrawerOpen = (state: RootState) => state.ui.isAIDrawerOpen;
export const selectHighlightedGameID = (state: RootState) => state.ui.highlightedGameID;
