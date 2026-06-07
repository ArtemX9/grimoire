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

export const toggleSidebar = () => ({ type: UI_TOGGLE_SIDEBAR, payload: {} });
export const setSelectedGame = (gameId: string | null) => ({ type: UI_SET_SELECTED_GAME, payload: { gameId } });
export const toggleAIDrawer = () => ({ type: UI_TOGGLE_AI_DRAWER, payload: {} });
export const setHighlightedGameID = (gameID: string | null) => ({ type: UI_SET_HIGHLIGHTED_GAME_ID, payload: { gameID } });

// ---------------------------------------------------------------------------
// Action union type
// ---------------------------------------------------------------------------

export type UiAction =
  | ReturnType<typeof toggleSidebar>
  | ReturnType<typeof setSelectedGame>
  | ReturnType<typeof toggleAIDrawer>
  | ReturnType<typeof setHighlightedGameID>;
