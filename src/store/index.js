import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import studentReducer from './slices/studentSlice'
import courseReducer from './slices/courseSlice'
import enrollmentReducer from './slices/enrollmentSlice'
import teacherReducer from './slices/teacherSlice'
import quizReducer from './slices/quizSlice'
import questionReducer from './slices/questionSlice'
import scheduleReducer from './slices/scheduleSlice'
import notificationReducer from './slices/notificationSlice'
import courseContentReducer from './slices/courseContentSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
    teachers: teacherReducer,
    quizzes: quizReducer,
    questions: questionReducer,
    schedule: scheduleReducer,
    notifications: notificationReducer,
    courseContent: courseContentReducer,
  },
})
