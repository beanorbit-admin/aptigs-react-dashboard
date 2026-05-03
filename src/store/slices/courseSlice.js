import { createSlice } from '@reduxjs/toolkit'

const courseSlice = createSlice({
  name: 'courses',
  initialState: { list: [], categories: [], selected: null },
  reducers: {
    setCourses: (state, action) => { state.list = action.payload },
    setCategories: (state, action) => { state.categories = action.payload },
    addCourse: (state, action) => { state.list.push(action.payload) },
    updateCourse: (state, action) => {
      const idx = state.list.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteCourse: (state, action) => {
      state.list = state.list.filter(c => c.id !== action.payload)
    },
    addCategory: (state, action) => { state.categories.push(action.payload) },
    updateCategory: (state, action) => {
      const idx = state.categories.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.categories[idx] = action.payload
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter(c => c.id !== action.payload)
    },
    setSelected: (state, action) => { state.selected = action.payload },
  },
})

export const { setCourses, setCategories, addCourse, updateCourse, deleteCourse, addCategory, updateCategory, deleteCategory, setSelected } = courseSlice.actions
export default courseSlice.reducer
