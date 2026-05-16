import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, UserCheck, UserPlus, ClipboardList, Calendar } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import CardSkeleton from '../../components/common/CardSkeleton'
import SkeletonRow from '../../components/common/SkeletonRow'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchDashboardStatsThunk } from '../../store/slices/courseSlice'
import { fetchEnrollmentsThunk } from '../../store/slices/enrollmentSlice'
import { formatDate } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
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
  const stats = useAppSelector(state => state.courses.stats)
  const statsLoading = useAppSelector(state => state.courses.loading)
  const enrollments = useAppSelector(state => state.enrollments.list)
  const enrollmentsLoading = useAppSelector(state => state.enrollments.loading)

  useEffect(() => {
    dispatch(fetchDashboardStatsThunk())
    dispatch(fetchEnrollmentsThunk({ page_size: 5, ordering: '-created_at' }))
  }, [dispatch])

  const recentEnrollments = enrollments.slice(0, 5)

  return (
    <PageWrapper title="Dashboard">
      {/* Stats row */}
      {statsLoading && !stats ? (
        <div className="mb-8"><CardSkeleton count={4} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Students" value={stats?.total_students} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={BookOpen} label="Active Enrollments" value={stats?.active_enrollments} color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={GraduationCap} label="Total Courses" value={stats?.total_courses} color="bg-amber-100 text-amber-600" />
          <StatCard icon={UserCheck} label="Total Teachers" value={stats?.total_teachers} color="bg-purple-100 text-purple-600" />
        </div>
      )}

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
              {enrollmentsLoading ? (
                <SkeletonRow cols={4} rows={5} />
              ) : (
                <>
                  {recentEnrollments.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.student_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.course_title}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant[e.status]}>{e.status}</Badge></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.payment_date)}</td>
                    </tr>
                  ))}
                  {recentEnrollments.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No enrollments yet</td></tr>
                  )}
                </>
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
