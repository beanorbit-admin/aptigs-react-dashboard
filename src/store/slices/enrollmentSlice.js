import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/enrollmentService'

export const fetchEnrollmentsThunk = createAsyncThunk('enrollments/fetchAll', async (params, { rejectWithValue }) => {
  try { return await svc.fetchEnrollments(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createEnrollmentThunk = createAsyncThunk('enrollments/create', async (data, { rejectWithValue }) => {
  try { return await svc.createEnrollment(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateEnrollmentThunk = createAsyncThunk('enrollments/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateEnrollment(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteEnrollmentThunk = createAsyncThunk('enrollments/delete', async (id, { rejectWithValue }) => {
  try { await svc.deleteEnrollment(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const markEnrollmentPaidThunk = createAsyncThunk('enrollments/markPaid', async (id, { rejectWithValue }) => {
  try { return await svc.markEnrollmentPaid(id) } catch (e) { return rejectWithValue(e.response?.data) }
})

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: { list: [], totalCount: 0, loading: false, error: null },
  reducers: {
    setEnrollments: (state, action) => { state.list = action.payload },
    addEnrollment: (state, action) => { state.list.push(action.payload) },
    updateEnrollment: (state, action) => {
      const idx = state.list.findIndex(e => e.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteEnrollment: (state, action) => { state.list = state.list.filter(e => e.id !== action.payload) },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollmentsThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchEnrollmentsThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.list = payload.results ?? payload
        state.totalCount = payload.count ?? state.list.length
      })
      .addCase(fetchEnrollmentsThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createEnrollmentThunk.fulfilled, (state, { payload }) => { state.list.push(payload) })
      .addCase(updateEnrollmentThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(e => e.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
      })
      .addCase(deleteEnrollmentThunk.fulfilled, (state, { payload: id }) => {
        state.list = state.list.filter(e => e.id !== id)
      })
      .addCase(markEnrollmentPaidThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(e => e.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
      })
  },
})

export const { setEnrollments, addEnrollment, updateEnrollment, deleteEnrollment } = enrollmentSlice.actions
export default enrollmentSlice.reducer
