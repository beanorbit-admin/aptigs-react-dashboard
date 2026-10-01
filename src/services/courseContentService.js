import api, { formDataConfig } from './api'

// Semesters
export const fetchSemesters = (params = {}) =>
  api.get('semesters/', { params }).then(r => r.data)

export const createSemester = (data) =>
  api.post('semesters/', data).then(r => r.data)

export const updateSemester = (id, data) =>
  api.patch(`semesters/${id}/`, data).then(r => r.data)

export const deleteSemester = (id) =>
  api.delete(`semesters/${id}/`)

// Subjects
export const fetchSubjects = (params = {}) =>
  api.get('subjects/', { params }).then(r => r.data)

export const createSubject = (data) =>
  api.post('subjects/', data).then(r => r.data)

export const updateSubject = (id, data) =>
  api.patch(`subjects/${id}/`, data).then(r => r.data)

export const deleteSubject = (id) =>
  api.delete(`subjects/${id}/`)

// Chapters
export const fetchChapters = (params = {}) =>
  api.get('chapters/', { params }).then(r => r.data)

export const createChapter = (data) =>
  api.post('chapters/', data).then(r => r.data)

export const updateChapter = (id, data) =>
  api.patch(`chapters/${id}/`, data).then(r => r.data)

export const deleteChapter = (id) =>
  api.delete(`chapters/${id}/`)

// Lessons
export const fetchLessons = (params = {}) =>
  api.get('lessons/', { params }).then(r => r.data)

export const createLesson = (data) =>
  api.post('lessons/', data, formDataConfig(data)).then(r => r.data)

export const updateLesson = (id, data) =>
  api.patch(`lessons/${id}/`, data, formDataConfig(data)).then(r => r.data)

export const deleteLesson = (id) =>
  api.delete(`lessons/${id}/`)
