import { createSlice } from '@reduxjs/toolkit'

const courseContentSlice = createSlice({
  name: 'courseContent',
  initialState: { semesters: [], subjects: [], chapters: [], lessons: [] },
  reducers: {
    setCourseContent(state, { payload }) {
      state.semesters = payload.semesters
      state.subjects  = payload.subjects
      state.chapters  = payload.chapters
      state.lessons   = payload.lessons
    },

    // Semesters
    addSemester(state, { payload })    { state.semesters.push(payload) },
    updateSemester(state, { payload }) {
      const i = state.semesters.findIndex(s => s.id === payload.id)
      if (i !== -1) state.semesters[i] = payload
    },
    deleteSemester(state, { payload: id }) {
      state.semesters = state.semesters.filter(s => s.id !== id)
      const subIds = state.subjects.filter(s => s.semesterId === id).map(s => s.id)
      state.subjects  = state.subjects.filter(s => s.semesterId !== id)
      const chIds = state.chapters.filter(c => subIds.includes(c.subjectId)).map(c => c.id)
      state.chapters  = state.chapters.filter(c => !subIds.includes(c.subjectId))
      state.lessons   = state.lessons.filter(l => !chIds.includes(l.chapterId))
    },

    // Subjects
    addSubject(state, { payload })    { state.subjects.push(payload) },
    updateSubject(state, { payload }) {
      const i = state.subjects.findIndex(s => s.id === payload.id)
      if (i !== -1) state.subjects[i] = payload
    },
    deleteSubject(state, { payload: id }) {
      state.subjects = state.subjects.filter(s => s.id !== id)
      const chIds = state.chapters.filter(c => c.subjectId === id).map(c => c.id)
      state.chapters = state.chapters.filter(c => c.subjectId !== id)
      state.lessons  = state.lessons.filter(l => !chIds.includes(l.chapterId))
    },

    // Chapters
    addChapter(state, { payload })    { state.chapters.push(payload) },
    updateChapter(state, { payload }) {
      const i = state.chapters.findIndex(c => c.id === payload.id)
      if (i !== -1) state.chapters[i] = payload
    },
    deleteChapter(state, { payload: id }) {
      state.chapters = state.chapters.filter(c => c.id !== id)
      state.lessons  = state.lessons.filter(l => l.chapterId !== id)
    },

    // Lessons
    addLesson(state, { payload })    { state.lessons.push(payload) },
    updateLesson(state, { payload }) {
      const i = state.lessons.findIndex(l => l.id === payload.id)
      if (i !== -1) state.lessons[i] = payload
    },
    deleteLesson(state, { payload: id }) {
      state.lessons = state.lessons.filter(l => l.id !== id)
    },
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
