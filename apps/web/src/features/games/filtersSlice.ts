import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { GameStatus } from '@grimoire/shared'

export interface FiltersState {
  status: GameStatus | null
  genre: string | null
  search: string
}

const initialState: FiltersState = {
  status: null,
  genre: null,
  search: '',
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<GameStatus | null>) => {
      state.status = action.payload
    },
    setGenreFilter: (state, action: PayloadAction<string | null>) => {
      state.genre = action.payload
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload
    },
    resetFilters: () => initialState,
  },
})

export const { setStatusFilter, setGenreFilter, setSearch, resetFilters } = filtersSlice.actions
export default filtersSlice.reducer
