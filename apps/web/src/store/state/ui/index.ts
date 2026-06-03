export const UI_SLICE = 'ui';

// ---------------------------------------------------------------------------
// Action type constants
// ---------------------------------------------------------------------------

export const UI_TOGGLE_SIDEBAR = 'ui/TOGGLE_SIDEBAR';
export const UI_SET_SELECTED_GAME = 'ui/SET_SELECTED_GAME';
export const UI_TOGGLE_AI_DRAWER = 'ui/TOGGLE_AI_DRAWER';
export const UI_SET_HIGHLIGHTED_GAME_ID = 'ui/SET_HIGHLIGHTED_GAME_ID';

// ---------------------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------------------

export const toggleSidebar = () => ({ type: UI_TOGGLE_SIDEBAR }) as const;
export const setSelectedGame = (payload: string | null) => ({ type: UI_SET_SELECTED_GAME, payload }) as const;
export const toggleAIDrawer = () => ({ type: UI_TOGGLE_AI_DRAWER }) as const;
export const setHighlightedGameID = (payload: string | null) => ({ type: UI_SET_HIGHLIGHTED_GAME_ID, payload }) as const;

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type UiAction =
  | ReturnType<typeof toggleSidebar>
  | ReturnType<typeof setSelectedGame>
  | ReturnType<typeof toggleAIDrawer>
  | ReturnType<typeof setHighlightedGameID>;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function uiReducer(state = initialState, rawAction: any): UiState {
  const action = rawAction as UiAction;
  switch (action.type) {
    case UI_TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case UI_SET_SELECTED_GAME:
      return { ...state, selectedGameId: action.payload };
    case UI_TOGGLE_AI_DRAWER:
      return { ...state, isAIDrawerOpen: !state.isAIDrawerOpen };
    case UI_SET_HIGHLIGHTED_GAME_ID:
      return { ...state, highlightedGameID: action.payload };
    default:
      return state;
  }
}

export default uiReducer;
