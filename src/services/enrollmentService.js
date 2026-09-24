import api from './api'

export const fetchEnrollments = (params = {}) =>
  api.get('enrollments/', { params }).then(r => r.data)

export const fetchEnrollment = (id) =>
  api.get(`enrollments/${id}/`).then(r => r.data)

export const createEnrollment = (data) =>
  api.post('enrollments/', data).then(r => r.data)

export const updateEnrollment = (id, data) =>
  api.patch(`enrollments/${id}/`, data).then(r => r.data)

export const deleteEnrollment = (id) =>
  api.delete(`enrollments/${id}/`)

export const markEnrollmentPaid = (id) =>
  api.post(`enrollments/${id}/mark-paid/`).then(r => r.data)
