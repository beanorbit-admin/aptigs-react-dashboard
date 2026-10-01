import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/teacherService'

export const fetchTeachersThunk = createAsyncThunk('teachers/fetchAll', async (params, { rejectWithValue }) => {
  try { return await svc.fetchTeachers(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchTeacherThunk = createAsyncThunk('teachers/fetchOne', async (id, { rejectWithValue }) => {
  try { return await svc.fetchTeacher(id) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createTeacherThunk = createAsyncThunk('teachers/create', async (data, { rejectWithValue }) => {
  try { return await svc.createTeacher(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateTeacherThunk = createAsyncThunk('teachers/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateTeacher(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const saveTeacherThunk = createAsyncThunk('teachers/save', async ({ id, data, photoFile }, { rejectWithValue }) => {
  try { return await svc.saveTeacher(id, data, photoFile) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteTeacherThunk = createAsyncThunk('teachers/delete', async (id, { rejectWithValue }) => {
  try { await svc.deleteTeacher(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const resetTeacherPasswordThunk = createAsyncThunk('teachers/resetPassword', async (id, { rejectWithValue }) => {
  try { return await svc.resetTeacherPassword(id) } catch (e) { return rejectWithValue(e.response?.data) }
})

const teacherSlice = createSlice({
  name: 'teachers',
  initialState: { list: [], selected: null, totalCount: 0, loading: false, error: null },
  reducers: {
    setTeachers: (state, action) => { state.list = action.payload },
    addTeacher: (state, action) => { state.list.push(action.payload) },
    updateTeacher: (state, action) => {
      const idx = state.list.findIndex(t => t.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteTeacher: (state, action) => { state.list = state.list.filter(t => t.id !== action.payload) },
    setSelected: (state, action) => { state.selected = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachersThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchTeachersThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.list = payload.results ?? payload
        state.totalCount = payload.count ?? state.list.length
      })
      .addCase(fetchTeachersThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchTeacherThunk.fulfilled, (state, { payload }) => { state.selected = payload })
      .addCase(createTeacherThunk.fulfilled, (state, { payload }) => { state.list.push(payload) })
      .addCase(updateTeacherThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(t => t.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
        if (state.selected?.id === payload.id) state.selected = payload
      })
      .addCase(saveTeacherThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(t => t.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
        else state.list.push(payload)
        if (state.selected?.id === payload.id) state.selected = payload
      })
      .addCase(deleteTeacherThunk.fulfilled, (state, { payload: id }) => {
        state.list = state.list.filter(t => t.id !== id)
      })
  },
})

export const { setTeachers, addTeacher, updateTeacher, deleteTeacher, setSelected } = teacherSlice.actions
export default teacherSlice.reducer
