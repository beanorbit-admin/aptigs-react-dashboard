import { createSlice } from '@reduxjs/toolkit'

const studentSlice = createSlice({
  name: 'students',
  initialState: { list: [], selected: null },
  reducers: {
    setStudents: (state, action) => { state.list = action.payload },
    addStudent: (state, action) => { state.list.push(action.payload) },
    updateStudent: (state, action) => {
      const idx = state.list.findIndex(s => s.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteStudent: (state, action) => {
      state.list = state.list.filter(s => s.id !== action.payload)
    },
    setSelected: (state, action) => { state.selected = action.payload },
  },
})

export const { setStudents, addStudent, updateStudent, deleteStudent, setSelected } = studentSlice.actions
export default studentSlice.reducer
