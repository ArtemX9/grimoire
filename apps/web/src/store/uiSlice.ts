import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const UI_SLICE = 'ui';

export interface UiState {
  sidebarOpen: boolean;
  selectedGameId: string | null;
  isAIDrawerOpen: boolean;
  highlightedGameID: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  selectedGameId: null,
  isAIDrawerOpen: false,
  highlightedGameID: null,
};

const uiSlice = createSlice({
  name: UI_SLICE,
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSelectedGame: (state, action: PayloadAction<string | null>) => {
      state.selectedGameId = action.payload;
    },
    toggleAIDrawer: (state) => {
      state.isAIDrawerOpen = !state.isAIDrawerOpen;
    },
    setHighlightedGameID: (state, action: PayloadAction<string | null>) => {
      state.highlightedGameID = action.payload;
    },
  },
});

export const { toggleSidebar, setSelectedGame, toggleAIDrawer, setHighlightedGameID } = uiSlice.actions;
export default uiSlice.reducer;
