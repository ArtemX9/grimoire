import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { Session } from '@/api/authApi';

export interface AuthState {
  session: Session | null;
  /**
   * True after the first getSession call has settled (success or failure).
   * Guards used to prevent redirect flicker on hard refresh.
   */
  isBootstrapped: boolean;
}

const initialState: AuthState = {
  session: null,
  isBootstrapped: false,
};
export const AUTH_SLICE = 'auth';
const authSlice = createSlice({
  name: AUTH_SLICE,
  initialState,
  reducers: {
    sessionLoaded: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.isBootstrapped = true;
    },
    sessionCleared: (state) => {
      state.session = null;
    },
  },
});

export const { sessionLoaded, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
