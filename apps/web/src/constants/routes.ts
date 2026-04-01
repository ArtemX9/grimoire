export const ROUTES = {
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_SETUP: '/admin/setup',
  CHANGE_PASSWORD: '/change-password',
  DEFAULT: '/',
  GAME_DETAILS: '/games/:id',
  LIBRARY: '/library',
  LOGIN: '/login',
  USER_SETTINGS: '/settings',
};

export const getGameDetailsURL = (gameID: string) => ROUTES.GAME_DETAILS.replace(':id', gameID);
