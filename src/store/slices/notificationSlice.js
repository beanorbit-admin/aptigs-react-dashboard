import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/notificationService'

export const fetchSystemStatusThunk = createAsyncThunk('notifications/fetchSystemStatus', async (_, { rejectWithValue }) => {
  try { return await svc.getSystemStatus() } catch (e) { return rejectWithValue(e.response?.data) }
})

export const sendNotificationNowThunk = createAsyncThunk('notifications/sendNow', async (data, { rejectWithValue }) => {
  try { return await svc.sendNotificationNow(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchNotificationsThunk = createAsyncThunk('notifications/fetchAll', async (params, { rejectWithValue }) => {
  try { return await svc.fetchNotifications(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const markAsReadThunk = createAsyncThunk('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try { await svc.markNotificationAsRead(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const markAllAsReadThunk = createAsyncThunk('notifications/markAllAsRead', async (_, { rejectWithValue }) => {
  try { return await svc.markAllNotificationsAsRead() } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchScheduledThunk = createAsyncThunk('notifications/fetchScheduled', async (params, { rejectWithValue }) => {
  try { return await svc.fetchScheduledNotifications(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createScheduledThunk = createAsyncThunk('notifications/createScheduled', async (data, { rejectWithValue }) => {
  try { return await svc.createScheduledNotification(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteScheduledThunk = createAsyncThunk('notifications/deleteScheduled', async (id, { rejectWithValue }) => {
  try { await svc.deleteScheduledNotification(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchSentThunk = createAsyncThunk('notifications/fetchSent', async (params, { rejectWithValue }) => {
  try { return await svc.fetchSentNotifications(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateSentThunk = createAsyncThunk('notifications/updateSent', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateAdminNotification(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteSentThunk = createAsyncThunk('notifications/deleteSent', async (id, { rejectWithValue }) => {
  try { await svc.deleteScheduledNotification(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], sent: [], scheduled: [], loading: false, error: null, systemStatus: null, sendLoading: false },
  reducers: {
    setNotifications: (state, action) => { state.list = action.payload },
    markAsRead: (state, action) => {
      const n = state.list.find(n => n.id === action.payload)
      if (n) n.is_read = true
    },
    markAllAsRead: (state) => { state.list.forEach(n => { n.is_read = true }) },
    sendNotification: (state, action) => { state.sent.unshift(action.payload) },
    addScheduled: (state, action) => { state.scheduled.push(action.payload) },
    deleteScheduled: (state, action) => { state.scheduled = state.scheduled.filter(s => s.id !== action.payload) },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchNotificationsThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        const items = payload.results ?? payload
        // Flatten nested notification fields so consumers read n.title, n.type, n.message directly
        state.list = items.map(n => ({
          ...n,
          title: n.notification?.title ?? n.title,
          message: n.notification?.message ?? n.message,
          type: n.notification?.type ?? n.type,
        }))
      })
      .addCase(fetchNotificationsThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(markAsReadThunk.fulfilled, (state, { payload: id }) => {
        const n = state.list.find(n => n.id === id)
        if (n) n.is_read = true
      })
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.list.forEach(n => { n.is_read = true })
      })
      .addCase(fetchScheduledThunk.fulfilled, (state, { payload }) => {
        state.scheduled = payload.results ?? payload
      })
      .addCase(createScheduledThunk.fulfilled, (state, { payload }) => { state.scheduled.push(payload) })
      .addCase(deleteScheduledThunk.fulfilled, (state, { payload: id }) => {
        state.scheduled = state.scheduled.filter(s => s.id !== id)
      })
      .addCase(fetchSentThunk.fulfilled, (state, { payload }) => { state.sent = payload.results ?? payload })
      .addCase(fetchSystemStatusThunk.fulfilled, (state, { payload }) => { state.systemStatus = payload })
      .addCase(sendNotificationNowThunk.pending, (state) => { state.sendLoading = true })
      .addCase(sendNotificationNowThunk.fulfilled, (state) => { state.sendLoading = false })
      .addCase(sendNotificationNowThunk.rejected, (state) => { state.sendLoading = false })
      .addCase(updateSentThunk.fulfilled, (state, { payload }) => {
        const idx = state.sent.findIndex(n => n.id === payload.id)
        if (idx !== -1) state.sent[idx] = payload
      })
      .addCase(deleteSentThunk.fulfilled, (state, { payload: id }) => {
        state.sent = state.sent.filter(n => n.id !== id)
      })
  },
})

export const {
  setNotifications, markAsRead, markAllAsRead,
  sendNotification, addScheduled, deleteScheduled,
} = notificationSlice.actions
export default notificationSlice.reducer
