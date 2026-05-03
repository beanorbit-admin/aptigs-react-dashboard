import { createSlice } from '@reduxjs/toolkit'

const quizSlice = createSlice({
  name: 'quizzes',
  initialState: { list: [], selected: null },
  reducers: {
    setQuizzes: (state, action) => { state.list = action.payload },
    addQuiz: (state, action) => { state.list.push(action.payload) },
    updateQuiz: (state, action) => {
      const idx = state.list.findIndex(q => q.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteQuiz: (state, action) => {
      state.list = state.list.filter(q => q.id !== action.payload)
    },
    setSelected: (state, action) => { state.selected = action.payload },
  },
})

export const { setQuizzes, addQuiz, updateQuiz, deleteQuiz, setSelected } = quizSlice.actions
export default quizSlice.reducer
