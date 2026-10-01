import api, { formDataConfig } from './api'

export const fetchTeachers = (params = {}) =>
  api.get('auth/teachers/', { params }).then(r => r.data)

export const fetchTeacher = (id) =>
  api.get(`auth/teachers/${id}/`).then(r => r.data)

export const createTeacher = (data) =>
  api.post('auth/teachers/', data, formDataConfig(data)).then(r => r.data)

export const updateTeacher = (id, data) =>
  api.patch(`auth/teachers/${id}/`, data, formDataConfig(data)).then(r => r.data)

export const deleteTeacher = (id) =>
  api.delete(`auth/teachers/${id}/`)

export const fetchTeacherOptions = (signal) =>
  api.get('auth/teachers/options/', { signal }).then(r => r.data)

// Saves fields as JSON (so empty lists like course_ids survive), then uploads the photo.
export const saveTeacher = async (id, data, photoFile) => {
  const teacher = id ? await updateTeacher(id, data) : await createTeacher(data)
  if (!photoFile) return teacher
  const formData = new FormData()
  formData.append('photo', photoFile)
  const updated = await updateTeacher(teacher.id, formData)
  return { ...updated, temp_password: teacher.temp_password }
}

export const resetTeacherPassword = (id) =>
  api.post(`auth/teachers/${id}/reset-password/`).then(r => r.data)
