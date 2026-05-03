import { createSlice } from '@reduxjs/toolkit'

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: { list: [] },
  reducers: {
    setEvents: (state, action) => { state.list = action.payload },
    addEvent: (state, action) => { state.list.push(action.payload) },
    updateEvent: (state, action) => {
      const idx = state.list.findIndex(e => e.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteEvent: (state, action) => {
      state.list = state.list.filter(e => e.id !== action.payload)
    },
  },
})

export const { setEvents, addEvent, updateEvent, deleteEvent } = scheduleSlice.actions
export default scheduleSlice.reducer
