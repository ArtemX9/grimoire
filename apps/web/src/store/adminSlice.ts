import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { AdminStats, AdminUserListResponse, AdminUserRow, AiGlobalSettings } from '@/api/adminApi';

export const ADMIN_SLICE = 'admin';

export interface AdminState {
  users: AdminUserRow[];
  usersTotal: number;
  isUsersLoading: boolean;

  stats: AdminStats | null;
  isStatsLoading: boolean;

  aiSettings: AiGlobalSettings | null;
  isAiSettingsLoading: boolean;
}

const initialState: AdminState = {
  users: [],
  usersTotal: 0,
  isUsersLoading: false,

  stats: null,
  isStatsLoading: false,

  aiSettings: null,
  isAiSettingsLoading: false,
};

const adminSlice = createSlice({
  name: ADMIN_SLICE,
  initialState,
  reducers: {
    usersLoadingStarted: (state) => {
      state.isUsersLoading = true;
    },
    usersLoaded: (state, action: PayloadAction<AdminUserListResponse>) => {
      state.users = action.payload.data;
      state.usersTotal = action.payload.total;
      state.isUsersLoading = false;
    },
    usersFailed: (state) => {
      state.isUsersLoading = false;
    },
    userRemoved: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
      state.usersTotal = Math.max(0, state.usersTotal - 1);
    },
    userAdded: (state, action: PayloadAction<AdminUserRow>) => {
      state.users = [action.payload, ...state.users];
      state.usersTotal += 1;
    },
    userPatched: (state, action: PayloadAction<AdminUserRow>) => {
      const idx = state.users.findIndex((u) => u.id === action.payload.id);
      if (idx !== -1) {
        state.users[idx] = action.payload;
      }
    },

    statsLoadingStarted: (state) => {
      state.isStatsLoading = true;
    },
    statsLoaded: (state, action: PayloadAction<AdminStats>) => {
      state.stats = action.payload;
      state.isStatsLoading = false;
    },
    statsFailed: (state) => {
      state.isStatsLoading = false;
    },

    aiSettingsLoadingStarted: (state) => {
      state.isAiSettingsLoading = true;
    },
    aiSettingsLoaded: (state, action: PayloadAction<AiGlobalSettings>) => {
      state.aiSettings = action.payload;
      state.isAiSettingsLoading = false;
    },
    aiSettingsFailed: (state) => {
      state.isAiSettingsLoading = false;
    },
    aiSettingsPatched: (state, action: PayloadAction<AiGlobalSettings>) => {
      state.aiSettings = action.payload;
    },
  },
});

export const {
  usersLoadingStarted,
  usersLoaded,
  usersFailed,
  userRemoved,
  userAdded,
  userPatched,
  statsLoadingStarted,
  statsLoaded,
  statsFailed,
  aiSettingsLoadingStarted,
  aiSettingsLoaded,
  aiSettingsFailed,
  aiSettingsPatched,
} = adminSlice.actions;

export default adminSlice.reducer;
