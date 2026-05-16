import api from './api'

export const fetchNotifications = (params = {}) =>
  api.get('notifications/', { params }).then(r => r.data)

export const markNotificationAsRead = (id) =>
  api.patch(`notifications/${id}/read/`).then(r => r.data)

export const markAllNotificationsAsRead = () =>
  api.post('notifications/mark-all-read/').then(r => r.data)

export const fetchScheduledNotifications = (params = {}) =>
  api.get('notifications/admin/', { params: { ...params, is_sent: false } }).then(r => r.data)

export const fetchSentNotifications = (params = {}) =>
  api.get('notifications/admin/', { params: { ...params, is_sent: true } }).then(r => r.data)

export const createScheduledNotification = (data) =>
  api.post('notifications/admin/', data).then(r => r.data)

export const deleteScheduledNotification = (id) =>
  api.delete(`notifications/admin/${id}/`)

export const getSystemStatus = () =>
  api.get('notifications/system-status/').then(r => r.data)

export const updateAdminNotification = (id, data) =>
  api.patch(`notifications/admin/${id}/`, data).then(r => r.data)

export const sendNotificationNow = (data) =>
  api.post('notifications/admin/', {
    title: data.title,
    message: data.message,
    type: data.type,
    target: data.recipient_type,
    course: data.course_id ?? null,
    selected_recipients: data.student_ids ?? [],
    // no scheduled_at → backend defaults to now
  }).then(r => r.data)
