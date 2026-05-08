import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], sent: [], scheduled: [] },
  reducers: {
    setNotifications: (state, action) => { state.list = action.payload },
    markAsRead: (state, action) => {
      const n = state.list.find(n => n.id === action.payload)
      if (n) n.read = true
    },
    markAllAsRead: (state) => {
      state.list.forEach(n => { n.read = true })
    },
    sendNotification: (state, action) => {
      state.sent.unshift(action.payload)
    },
    addScheduled: (state, action) => {
      state.scheduled.push(action.payload)
    },
    deleteScheduled: (state, action) => {
      state.scheduled = state.scheduled.filter(s => s.id !== action.payload)
    },
  },
})

export const {
  setNotifications, markAsRead, markAllAsRead,
  sendNotification, addScheduled, deleteScheduled,
} = notificationSlice.actions
export default notificationSlice.reducer
