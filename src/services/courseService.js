import api, { formDataConfig } from './api'

// Dashboard
export const fetchDashboardStats = () =>
  api.get('dashboard/stats/').then(r => r.data)

// Categories
export const fetchCategories = (params = {}) =>
  api.get('categories/', { params }).then(r => r.data)

export const createCategory = (data) =>
  api.post('categories/', data).then(r => r.data)

export const updateCategory = (id, data) =>
  api.patch(`categories/${id}/`, data).then(r => r.data)

export const deleteCategory = (id) =>
  api.delete(`categories/${id}/`)

// Courses
export const fetchCourses = (params = {}) =>
  api.get('courses/', { params }).then(r => r.data)

export const fetchCourse = (id) =>
  api.get(`courses/${id}/`).then(r => r.data)

export const createCourse = (data) =>
  api.post('courses/', data, formDataConfig(data)).then(r => r.data)

export const updateCourse = (id, data) =>
  api.patch(`courses/${id}/`, data, formDataConfig(data)).then(r => r.data)

export const deleteCourse = (id) =>
  api.delete(`courses/${id}/`)

export const fetchCourseOptions = (signal) =>
  api.get('courses/options/', { signal }).then(r => r.data)

// Saves fields as JSON (so empty lists like teacher_ids survive), then uploads the image.
export const saveCourse = async (id, data, imageFile) => {
  const course = id ? await updateCourse(id, data) : await createCourse(data)
  if (!imageFile) return course
  const formData = new FormData()
  formData.append('image', imageFile)
  return updateCourse(course.id, formData)
}

export const fetchCardThemes = () =>
  api.get('courses/card-themes/').then(r => r.data)
