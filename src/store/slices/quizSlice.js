import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as svc from '../../services/assessmentService'

export const fetchQuizzesThunk = createAsyncThunk('quizzes/fetchAll', async (params, { rejectWithValue }) => {
  try { return await svc.fetchQuizzes(params) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const fetchQuizThunk = createAsyncThunk('quizzes/fetchOne', async (id, { rejectWithValue }) => {
  try { return await svc.fetchQuiz(id) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const createQuizThunk = createAsyncThunk('quizzes/create', async (data, { rejectWithValue }) => {
  try { return await svc.createQuiz(data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const updateQuizThunk = createAsyncThunk('quizzes/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await svc.updateQuiz(id, data) } catch (e) { return rejectWithValue(e.response?.data) }
})

export const deleteQuizThunk = createAsyncThunk('quizzes/delete', async (id, { rejectWithValue }) => {
  try { await svc.deleteQuiz(id); return id } catch (e) { return rejectWithValue(e.response?.data) }
})

export const addQuestionsThunk = createAsyncThunk('quizzes/addQuestions', async ({ quizId, questionIds }, { rejectWithValue }) => {
  try {
    await svc.addQuestionsToQuiz(quizId, questionIds)
    return await svc.fetchQuiz(quizId)
  } catch (e) { return rejectWithValue(e.response?.data) }
})

export const removeQuestionThunk = createAsyncThunk('quizzes/removeQuestion', async ({ quizId, questionId }, { rejectWithValue }) => {
  try { await svc.removeQuestionFromQuiz(quizId, questionId); return { quizId, questionId } } catch (e) { return rejectWithValue(e.response?.data) }
})

const quizSlice = createSlice({
  name: 'quizzes',
  initialState: { list: [], selected: null, totalCount: 0, loading: false, error: null },
  reducers: {
    setQuizzes: (state, action) => { state.list = action.payload },
    addQuiz: (state, action) => { state.list.push(action.payload) },
    updateQuiz: (state, action) => {
      const idx = state.list.findIndex(q => q.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    deleteQuiz: (state, action) => { state.list = state.list.filter(q => q.id !== action.payload) },
    setSelected: (state, action) => { state.selected = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzesThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchQuizzesThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.list = payload.results ?? payload
        state.totalCount = payload.count ?? state.list.length
      })
      .addCase(fetchQuizzesThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(fetchQuizThunk.fulfilled, (state, { payload }) => {
        state.selected = payload
        const idx = state.list.findIndex(q => q.id === payload.id)
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...payload }
        else state.list.push(payload)
      })
      .addCase(createQuizThunk.fulfilled, (state, { payload }) => { state.list.push(payload) })
      .addCase(updateQuizThunk.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex(q => q.id === payload.id)
        if (idx !== -1) state.list[idx] = payload
        if (state.selected?.id === payload.id) state.selected = payload
      })
      .addCase(deleteQuizThunk.fulfilled, (state, { payload: id }) => {
        state.list = state.list.filter(q => q.id !== id)
      })
      .addCase(addQuestionsThunk.fulfilled, (state, { payload }) => {
        const quiz = state.list.find(q => q.id === payload.id)
        if (quiz) quiz.quiz_questions = payload.quiz_questions ?? quiz.quiz_questions
      })
      .addCase(removeQuestionThunk.fulfilled, (state, { payload: { quizId, questionId } }) => {
        const quiz = state.list.find(q => q.id === quizId)
        if (quiz) quiz.quiz_questions = (quiz.quiz_questions || []).filter(qq => qq.question?.id !== questionId)
      })
  },
})

export const { setQuizzes, addQuiz, updateQuiz, deleteQuiz, setSelected } = quizSlice.actions
export default quizSlice.reducer
