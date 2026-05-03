import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '../pages/Login/LoginPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import StudentList from '../pages/Students/StudentList'
import StudentDetail from '../pages/Students/StudentDetail'
import AddStudentPage from '../pages/Students/AddStudentPage'
import EnrollmentsPage from '../pages/Enrollments/EnrollmentsPage'
import CourseList from '../pages/Courses/CourseList'
import Categories from '../pages/Courses/Categories'
import CourseDetail from '../pages/Courses/CourseDetail'
import SemesterList from '../pages/Courses/SemesterList'
import SubjectList from '../pages/Courses/SubjectList'
import ChapterSubjectView from '../pages/Courses/ChapterSubjectView'
import TeacherList from '../pages/Teachers/TeacherList'
import TeacherDetail from '../pages/Teachers/TeacherDetail'
import QuizList from '../pages/Quizzes/QuizList'
import QuizForm from '../pages/Quizzes/QuizForm'
import QuestionList from '../pages/Questions/QuestionList'
import QuestionForm from '../pages/Questions/QuestionForm'
import SchedulePage from '../pages/Schedule/SchedulePage'
import PaymentsPage from '../pages/Payments/PaymentsPage'
import NotificationsPage from '../pages/Notifications/NotificationsPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
        <Route path="/students/new" element={<ProtectedRoute><AddStudentPage /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
        <Route path="/enrollments" element={<ProtectedRoute><EnrollmentsPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
        <Route path="/courses/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/courses/:courseId/content" element={<ProtectedRoute><SemesterList /></ProtectedRoute>} />
        <Route path="/courses/:courseId/content/:semesterId" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
        <Route path="/courses/:courseId/content/:semesterId/:subjectId" element={<ProtectedRoute><ChapterSubjectView /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute adminOnly><TeacherList /></ProtectedRoute>} />
        <Route path="/teachers/:id" element={<ProtectedRoute adminOnly><TeacherDetail /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
        <Route path="/quizzes/new" element={<ProtectedRoute><QuizForm /></ProtectedRoute>} />
        <Route path="/quizzes/:id/edit" element={<ProtectedRoute><QuizForm /></ProtectedRoute>} />
        <Route path="/questions" element={<ProtectedRoute><QuestionList /></ProtectedRoute>} />
        <Route path="/questions/new" element={<ProtectedRoute><QuestionForm /></ProtectedRoute>} />
        <Route path="/questions/:id/edit" element={<ProtectedRoute><QuestionForm /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
