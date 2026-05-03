import { createSlice } from '@reduxjs/toolkit'

const questionSlice = createSlice({
  name: 'questions',
  initialState: { list: [], selected: null },
  reducers: {
    setQuestions: (state, action) => { state.list = action.payload },
    addQuestion: (state, action) => { state.list.push(action.payload) },
    updateQuestion: (state, action) => {
      const idx = state.list.findIndex(q => q.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteQuestion: (state, action) => {
      state.list = state.list.filter(q => q.id !== action.payload)
    },
    setSelected: (state, action) => { state.selected = action.payload },
  },
})

export const { setQuestions, addQuestion, updateQuestion, deleteQuestion, setSelected } = questionSlice.actions
export default questionSlice.reducer
