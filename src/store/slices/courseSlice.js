import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/courseService'

export const fetchDashboardStatsThunk = createAsyncThunk('courses/fetchStats', async (_, { rejectWithValue }) => {
  try { return await svc.fetchDashboardStats() } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchCategoriesThunk = createAsyncThunk('courses/fetchCategories', async (params, { rejectWithValue }) => {
  try { return await svc.fetchCategories(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createCategoryThunk = createAsyncThunk('courses/createCategory', async (data, { rejectWithValue }) => {
  try { return await svc.createCategory(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateCategoryThunk = createAsyncThunk('courses/updateCategory', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateCategory(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteCategoryThunk = createAsyncThunk('courses/deleteCategory', async (id, { rejectWithValue }) => {
  try { await svc.deleteCategory(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchCoursesThunk = createAsyncThunk('courses/fetchAll', async (params, { rejectWithValue }) => {
  try { return await svc.fetchCourses(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchCourseThunk = createAsyncThunk('courses/fetchOne', async (id, { rejectWithValue }) => {
  try { return await svc.fetchCourse(id) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createCourseThunk = createAsyncThunk('courses/create', async (data, { rejectWithValue }) => {
  try { return await svc.createCourse(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateCourseThunk = createAsyncThunk('courses/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateCourse(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const saveCourseThunk = createAsyncThunk('courses/save', async ({ id, data, imageFile }, { rejectWithValue }) => {
  try { return await svc.saveCourse(id, data, imageFile) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteCourseThunk = createAsyncThunk('courses/delete', async (id, { rejectWithValue }) => {
  try { await svc.deleteCourse(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [], categories: [], selected: null,
    totalCount: 0, stats: null, loading: false, error: null,
  },
  reducers: {
    setCourses: (state, action) => { state.list = action.payload },
    setCategories: (state, action) => { state.categories = action.payload },
    addCourse: (state, action) => { state.list.push(action.payload) },
    updateCourse: (state, action) => {
      const idx = state.list.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteCourse: (state, action) => { state.list = state.list.filter(c => c.id !== action.payload) },
    addCategory: (state, action) => { state.categories.push(action.payload) },
    updateCategory: (state, action) => {
      const idx = state.categories.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.categories[idx] = action.payload
    },
    deleteCategory: (state, action) => { state.categories = state.categories.filter(c => c.id !== action.payload) },
    setSelected: (state, action) => { state.selected = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStatsThunk.fulfilled, (state, { payload }) => { state.stats = payload })
      .addCase(fetchCategoriesThunk.pending, (state) => { state.loading = true })
      .addCase(fetchCategoriesThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.categories = payload.results ?? payload
      })
      .addCase(fetchCategoriesThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createCategoryThunk.fulfilled, (state, { payload }) => { state.categories.push(payload) })
      .addCase(updateCategoryThunk.fulfilled, (state, { payload }) => {
        const idx = state.categories.findIndex(c => c.id === payload.id)
        if (idx !== -1) state.categories[idx] = payload
      })
      .addCase(deleteCategoryThunk.fulfilled, (state, { payload: id }) => {
        state.categories = state.categories.filter(c => c.id !== id)
      })
      .addCase(fetchCoursesThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCoursesThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.list = payload.results ?? payload
        state.totalCount = payload.count ?? state.list.length
      })
      .addCase(fetchCoursesThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchCourseThunk.fulfilled, (state, { payload }) => { state.selected = payload })
      .addCase(createCourseThunk.fulfilled, (state, { payload }) => { state.list.push(payload) })
      .addCase(updateCourseThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(c => c.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
        if (state.selected?.id === payload.id) state.selected = payload
      })
      .addCase(saveCourseThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(c => c.id === payload.id)
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...payload }
        else state.list.push(payload)
        if (state.selected?.id === payload.id) state.selected = payload
      })
      .addCase(deleteCourseThunk.fulfilled, (state, { payload: id }) => {
        state.list = state.list.filter(c => c.id !== id)
      })
  },
})

export const { setCourses, setCategories, addCourse, updateCourse, deleteCourse, addCategory, updateCategory, deleteCategory, setSelected } = courseSlice.actions
export default courseSlice.reducer
