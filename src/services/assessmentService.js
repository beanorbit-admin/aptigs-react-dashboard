import api from './api'

// Questions
export const fetchQuestions = (params = {}) =>
  api.get('questions/', { params }).then(r => r.data)

export const fetchQuestion = (id) =>
  api.get(`questions/${id}/`).then(r => r.data)

export const createQuestion = (data) =>
  api.post('questions/', data).then(r => r.data)

export const updateQuestion = (id, data) =>
  api.patch(`questions/${id}/`, data).then(r => r.data)

export const deleteQuestion = (id) =>
  api.delete(`questions/${id}/`)

// Quizzes
export const fetchQuizzes = (params = {}) =>
  api.get('quizzes/', { params }).then(r => r.data)

export const fetchQuiz = (id) =>
  api.get(`quizzes/${id}/`).then(r => r.data)

export const createQuiz = (data) =>
  api.post('quizzes/', data).then(r => r.data)

export const updateQuiz = (id, data) =>
  api.patch(`quizzes/${id}/`, data).then(r => r.data)

export const deleteQuiz = (id) =>
  api.delete(`quizzes/${id}/`)

export const addQuestionsToQuiz = (quizId, questionIds) =>
  api.post(`quizzes/${quizId}/add-questions/`, { question_ids: questionIds }).then(r => r.data)

export const removeQuestionFromQuiz = (quizId, questionId) =>
  api.delete(`quizzes/${quizId}/questions/${questionId}/`)
