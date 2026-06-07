import {
  UI_SET_HIGHLIGHTED_GAME_ID,
  UI_SET_SELECTED_GAME,
  UI_TOGGLE_AI_DRAWER,
  UI_TOGGLE_SIDEBAR,
  type UiAction,
  setHighlightedGameID,
  setSelectedGame,
  toggleAIDrawer,
  toggleSidebar,
} from '@/store/actions/ui';

export {
  setHighlightedGameID,
  setSelectedGame,
  toggleAIDrawer,
  toggleSidebar,
} from '@/store/actions/ui';

export const UI_SLICE = 'ui';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function uiReducer(state = initialState, action: UiAction): UiState {
  switch (action.type) {
    // toggleSidebar
    case UI_TOGGLE_SIDEBAR:
      return handleUiToggleSidebar(state, action as ReturnType<typeof toggleSidebar>);

    // setSelectedGame
    case UI_SET_SELECTED_GAME:
      return handleUiSetSelectedGame(state, action as ReturnType<typeof setSelectedGame>);

    // toggleAIDrawer
    case UI_TOGGLE_AI_DRAWER:
      return handleUiToggleAIDrawer(state, action as ReturnType<typeof toggleAIDrawer>);

    // setHighlightedGameID
    case UI_SET_HIGHLIGHTED_GAME_ID:
      return handleUiSetHighlightedGameID(state, action as ReturnType<typeof setHighlightedGameID>);

    default:
      return state;
  }
}

// toggleSidebar
function handleUiToggleSidebar(state: UiState, _action: ReturnType<typeof toggleSidebar>): UiState {
  return { ...state, sidebarOpen: !state.sidebarOpen };
}

// setSelectedGame
function handleUiSetSelectedGame(state: UiState, action: ReturnType<typeof setSelectedGame>): UiState {
  return { ...state, selectedGameId: action.payload.gameId };
}

// toggleAIDrawer
function handleUiToggleAIDrawer(state: UiState, _action: ReturnType<typeof toggleAIDrawer>): UiState {
  return { ...state, isAIDrawerOpen: !state.isAIDrawerOpen };
}

// setHighlightedGameID
function handleUiSetHighlightedGameID(state: UiState, action: ReturnType<typeof setHighlightedGameID>): UiState {
  return { ...state, highlightedGameID: action.payload.gameID };
}

export default uiReducer;
