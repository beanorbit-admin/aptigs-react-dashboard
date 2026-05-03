import { createSlice } from '@reduxjs/toolkit'

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: { list: [] },
  reducers: {
    setEnrollments: (state, action) => { state.list = action.payload },
    addEnrollment: (state, action) => { state.list.push(action.payload) },
    updateEnrollment: (state, action) => {
      const idx = state.list.findIndex(e => e.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteEnrollment: (state, action) => {
      state.list = state.list.filter(e => e.id !== action.payload)
    },
  },
})

export const { setEnrollments, addEnrollment, updateEnrollment, deleteEnrollment } = enrollmentSlice.actions
export default enrollmentSlice.reducer
