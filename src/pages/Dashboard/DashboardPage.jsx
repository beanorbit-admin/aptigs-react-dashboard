import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, UserCheck, UserPlus, ClipboardList, Calendar } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setStudents } from '../../store/slices/studentSlice'
import { setCourses } from '../../store/slices/courseSlice'
import { setEnrollments } from '../../store/slices/enrollmentSlice'
import { setTeachers } from '../../store/slices/teacherSlice'
import { setNotifications } from '../../store/slices/notificationSlice'
import { students as mockStudents } from '../../mock/students'
import { courses as mockCourses, categories as mockCategories } from '../../mock/courses'
import { enrollments as mockEnrollments } from '../../mock/enrollments'
import { teachers as mockTeachers } from '../../mock/teachers'
import { notifications as mockNotifications } from '../../mock/notifications'
import { setCategories } from '../../store/slices/courseSlice'
import { formatDate, formatCurrency } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function QuickCard({ icon: Icon, label, to, color, navigate }) {
  return (
    <button
      onClick={() => navigate(to)}
      className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md hover:scale-105 transition-all w-full"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const students = useAppSelector(state => state.students.list)
  const courses = useAppSelector(state => state.courses.list)
  const enrollments = useAppSelector(state => state.enrollments.list)
  const teachers = useAppSelector(state => state.teachers.list)

  useEffect(() => {
    dispatch(setStudents(mockStudents))
    dispatch(setCourses(mockCourses))
    dispatch(setCategories(mockCategories))
    dispatch(setEnrollments(mockEnrollments))
    dispatch(setTeachers(mockTeachers))
    dispatch(setNotifications(mockNotifications))
  }, [dispatch])

  const recentEnrollments = [...enrollments].slice(-5).reverse()

  return (
    <PageWrapper title="Dashboard">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={students.length} color="bg-indigo-100 text-indigo-600" />
        <StatCard icon={BookOpen} label="Active Enrollments" value={enrollments.length} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={GraduationCap} label="Total Courses" value={courses.length} color="bg-amber-100 text-amber-600" />
        <StatCard icon={UserCheck} label="Total Teachers" value={teachers.length} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Enrollment Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                {['Student Name', 'Course', 'Payment Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEnrollments.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.studentName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.courseName}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[e.status]}>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.paymentDate)}</td>
                </tr>
              ))}
              {recentEnrollments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No enrollments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickCard icon={UserPlus} label="Add Student" to="/students" color="bg-indigo-100 text-indigo-600" navigate={navigate} />
          <QuickCard icon={ClipboardList} label="Create Quiz" to="/quizzes/new" color="bg-emerald-100 text-emerald-600" navigate={navigate} />
          <QuickCard icon={Calendar} label="Schedule Class" to="/schedule" color="bg-amber-100 text-amber-600" navigate={navigate} />
        </div>
      </div>
    </PageWrapper>
  )
}
