import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const UI_SLICE = 'ui';

export interface UiState {
  sidebarOpen: boolean;
  selectedGameId: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  selectedGameId: null,
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
  },
});

export const { toggleSidebar, setSelectedGame } = uiSlice.actions;
export default uiSlice.reducer;
