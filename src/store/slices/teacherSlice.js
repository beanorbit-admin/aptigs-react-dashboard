import { createSlice } from '@reduxjs/toolkit'

const teacherSlice = createSlice({
  name: 'teachers',
  initialState: { list: [], selected: null },
  reducers: {
    setTeachers: (state, action) => { state.list = action.payload },
    addTeacher: (state, action) => { state.list.push(action.payload) },
    updateTeacher: (state, action) => {
      const idx = state.list.findIndex(t => t.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteTeacher: (state, action) => {
      state.list = state.list.filter(t => t.id !== action.payload)
    },
    setSelected: (state, action) => { state.selected = action.payload },
  },
})

export const { setTeachers, addTeacher, updateTeacher, deleteTeacher, setSelected } = teacherSlice.actions
export default teacherSlice.reducer
