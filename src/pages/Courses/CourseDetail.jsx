import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchCoursesThunk, updateCourseThunk } from '../../store/slices/courseSlice'
import { fetchTeachersThunk } from '../../store/slices/teacherSlice'
import { fetchEnrollmentsThunk } from '../../store/slices/enrollmentSlice'
import { fetchStudentsThunk } from '../../store/slices/studentSlice'
import { formatCurrency } from '../../utils/formatters'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const course = useAppSelector(state => state.courses.list.find(c => c.id === Number(id)))
  const teachers = useAppSelector(state => state.teachers.list)
  const enrollments = useAppSelector(state => state.enrollments.list.filter(e => e.course === Number(id)))
  const students = useAppSelector(state => state.students.list)

  useEffect(() => {
    dispatch(fetchCoursesThunk())
    dispatch(fetchTeachersThunk())
    dispatch(fetchEnrollmentsThunk({ course: id }))
    dispatch(fetchStudentsThunk())
  }, [dispatch, id])

  if (!course) return (
    <PageWrapper title="Course Detail">
      <p className="text-gray-500">Course not found.</p>
    </PageWrapper>
  )

  const assignedTeachers = teachers.filter(t => course.teacher_ids?.includes(t.id))
  const enrolledStudents = enrollments.map(e => ({ ...e, studentObj: students.find(s => s.id === e.student) }))

  const removeTeacher = async (tid) => {
    const newIds = (course.teacher_ids || []).filter(x => x !== tid)
    const result = await dispatch(updateCourseThunk({ id: course.id, data: { teacher_ids: newIds } }))
    if (result.meta.requestStatus === 'fulfilled') toast.success('Teacher removed')
    else toast.error('Remove failed')
  }

  return (
    <PageWrapper title="Course Detail">
      <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </button>

      {/* Course info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
            <p className="text-gray-500 text-sm mt-1">{course.description}</p>
          </div>
          <Badge variant={course.status === 'Active' ? 'success' : 'default'}>{course.status}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
            <p className="text-sm text-gray-800 font-medium">{course.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Duration</p>
            <p className="text-sm text-gray-800 font-medium">{course.duration}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Fee</p>
            <p className="text-sm text-gray-800 font-medium">{formatCurrency(course.fee)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Students */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Enrolled Students ({enrolledStudents.length})</h3>
          {enrolledStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No students enrolled</p>
          ) : (
            <Table
              columns={[
                { header: 'Student', cell: e => <span className="font-medium text-gray-900">{e.student_name}</span> },
                { header: 'Email', cell: e => e.studentObj?.email || '—' },
                { header: 'Collected', cell: e => formatCurrency(e.collected_amount) },
                {
                  header: 'Status',
                  cell: e => (
                    <Badge variant={e.status === 'Paid' ? 'success' : e.status === 'Partial' ? 'warning' : 'danger'}>
                      {e.status}
                    </Badge>
                  ),
                },
              ]}
              data={enrolledStudents}
            />
          )}
        </div>

        {/* Assigned Teachers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Teachers</h3>
          {assignedTeachers.length === 0 ? (
            <p className="text-sm text-gray-400">No teachers assigned</p>
          ) : (
            <ul className="space-y-2">
              {assignedTeachers.map(t => (
                <li key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  <button onClick={() => removeTeacher(t.id)} className="text-red-500 hover:text-red-700 p-0.5">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
