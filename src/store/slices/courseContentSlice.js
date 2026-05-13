import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/courseContentService'

export const fetchSemestersThunk = createAsyncThunk('courseContent/fetchSemesters', async (params, { rejectWithValue }) => {
  try { return await svc.fetchSemesters(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createSemesterThunk = createAsyncThunk('courseContent/createSemester', async (data, { rejectWithValue }) => {
  try { return await svc.createSemester(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateSemesterThunk = createAsyncThunk('courseContent/updateSemester', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateSemester(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteSemesterThunk = createAsyncThunk('courseContent/deleteSemester', async (id, { rejectWithValue }) => {
  try { await svc.deleteSemester(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchSubjectsThunk = createAsyncThunk('courseContent/fetchSubjects', async (params, { rejectWithValue }) => {
  try { return await svc.fetchSubjects(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createSubjectThunk = createAsyncThunk('courseContent/createSubject', async (data, { rejectWithValue }) => {
  try { return await svc.createSubject(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateSubjectThunk = createAsyncThunk('courseContent/updateSubject', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateSubject(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteSubjectThunk = createAsyncThunk('courseContent/deleteSubject', async (id, { rejectWithValue }) => {
  try { await svc.deleteSubject(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchChaptersThunk = createAsyncThunk('courseContent/fetchChapters', async (params, { rejectWithValue }) => {
  try { return await svc.fetchChapters(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createChapterThunk = createAsyncThunk('courseContent/createChapter', async (data, { rejectWithValue }) => {
  try { return await svc.createChapter(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateChapterThunk = createAsyncThunk('courseContent/updateChapter', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateChapter(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteChapterThunk = createAsyncThunk('courseContent/deleteChapter', async (id, { rejectWithValue }) => {
  try { await svc.deleteChapter(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchLessonsThunk = createAsyncThunk('courseContent/fetchLessons', async (params, { rejectWithValue }) => {
  try { return await svc.fetchLessons(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createLessonThunk = createAsyncThunk('courseContent/createLesson', async (data, { rejectWithValue }) => {
  try { return await svc.createLesson(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateLessonThunk = createAsyncThunk('courseContent/updateLesson', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateLesson(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteLessonThunk = createAsyncThunk('courseContent/deleteLesson', async (id, { rejectWithValue }) => {
  try { await svc.deleteLesson(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

const courseContentSlice = createSlice({
  name: 'courseContent',
  initialState: { semesters: [], subjects: [], chapters: [], lessons: [], loading: false, error: null },
  reducers: {
    setCourseContent(state, { payload }) {
      state.semesters = payload.semesters
      state.subjects  = payload.subjects
      state.chapters  = payload.chapters
      state.lessons   = payload.lessons
    },
    addSemester(state, { payload })    { state.semesters.push(payload) },
    updateSemester(state, { payload }) {
      const i = state.semesters.findIndex(s => s.id === payload.id)
      if (i !== -1) state.semesters[i] = payload
    },
    deleteSemester(state, { payload: id }) {
      state.semesters = state.semesters.filter(s => s.id !== id)
      const subIds = state.subjects.filter(s => s.semester === id).map(s => s.id)
      state.subjects  = state.subjects.filter(s => s.semester !== id)
      const chIds = state.chapters.filter(c => subIds.includes(c.subject)).map(c => c.id)
      state.chapters  = state.chapters.filter(c => !subIds.includes(c.subject))
      state.lessons   = state.lessons.filter(l => !chIds.includes(l.chapter))
    },
    addSubject(state, { payload })    { state.subjects.push(payload) },
    updateSubject(state, { payload }) {
      const i = state.subjects.findIndex(s => s.id === payload.id)
      if (i !== -1) state.subjects[i] = payload
    },
    deleteSubject(state, { payload: id }) {
      state.subjects = state.subjects.filter(s => s.id !== id)
      const chIds = state.chapters.filter(c => c.subject === id).map(c => c.id)
      state.chapters = state.chapters.filter(c => c.subject !== id)
      state.lessons  = state.lessons.filter(l => !chIds.includes(l.chapter))
    },
    addChapter(state, { payload })    { state.chapters.push(payload) },
    updateChapter(state, { payload }) {
      const i = state.chapters.findIndex(c => c.id === payload.id)
      if (i !== -1) state.chapters[i] = payload
    },
    deleteChapter(state, { payload: id }) {
      state.chapters = state.chapters.filter(c => c.id !== id)
      state.lessons  = state.lessons.filter(l => l.chapter !== id)
    },
    addLesson(state, { payload })    { state.lessons.push(payload) },
    updateLesson(state, { payload }) {
      const i = state.lessons.findIndex(l => l.id === payload.id)
      if (i !== -1) state.lessons[i] = payload
    },
    deleteLesson(state, { payload: id }) {
      state.lessons = state.lessons.filter(l => l.id !== id)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSemestersThunk.pending, (state) => { state.loading = true })
      .addCase(fetchSemestersThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.semesters = payload.results ?? payload
      })
      .addCase(fetchSemestersThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createSemesterThunk.fulfilled, (state, { payload }) => { state.semesters.push(payload) })
      .addCase(updateSemesterThunk.fulfilled, (state, { payload }) => {
        const i = state.semesters.findIndex(s => s.id === payload.id)
        if (i !== -1) state.semesters[i] = payload
      })
      .addCase(deleteSemesterThunk.fulfilled, (state, { payload: id }) => {
        state.semesters = state.semesters.filter(s => s.id !== id)
      })
      .addCase(fetchSubjectsThunk.fulfilled, (state, { payload }) => {
        state.subjects = payload.results ?? payload
      })
      .addCase(createSubjectThunk.fulfilled, (state, { payload }) => { state.subjects.push(payload) })
      .addCase(updateSubjectThunk.fulfilled, (state, { payload }) => {
        const i = state.subjects.findIndex(s => s.id === payload.id)
        if (i !== -1) state.subjects[i] = payload
      })
      .addCase(deleteSubjectThunk.fulfilled, (state, { payload: id }) => {
        state.subjects = state.subjects.filter(s => s.id !== id)
      })
      .addCase(fetchChaptersThunk.fulfilled, (state, { payload }) => {
        state.chapters = payload.results ?? payload
      })
      .addCase(createChapterThunk.fulfilled, (state, { payload }) => { state.chapters.push(payload) })
      .addCase(updateChapterThunk.fulfilled, (state, { payload }) => {
        const i = state.chapters.findIndex(c => c.id === payload.id)
        if (i !== -1) state.chapters[i] = payload
      })
      .addCase(deleteChapterThunk.fulfilled, (state, { payload: id }) => {
        state.chapters = state.chapters.filter(c => c.id !== id)
      })
      .addCase(fetchLessonsThunk.fulfilled, (state, { payload }) => {
        state.lessons = payload.results ?? payload
      })
      .addCase(createLessonThunk.fulfilled, (state, { payload }) => { state.lessons.push(payload) })
      .addCase(updateLessonThunk.fulfilled, (state, { payload }) => {
        const i = state.lessons.findIndex(l => l.id === payload.id)
        if (i !== -1) state.lessons[i] = payload
      })
      .addCase(deleteLessonThunk.fulfilled, (state, { payload: id }) => {
        state.lessons = state.lessons.filter(l => l.id !== id)
      })
  },
})

export const {
  setCourseContent,
  addSemester, updateSemester, deleteSemester,
  addSubject, updateSubject, deleteSubject,
  addChapter, updateChapter, deleteChapter,
  addLesson, updateLesson, deleteLesson,
} = courseContentSlice.actions

export default courseContentSlice.reducer
