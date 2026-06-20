import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchStudentThunk, updateStudentThunk, deleteStudentThunk } from '../../store/slices/studentSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'
import { fetchEnrollmentsThunk, createEnrollmentThunk } from '../../store/slices/enrollmentSlice'
import { formatCurrency, formatDate } from '../../utils/formatters'
import CardSkeleton from '../../components/common/CardSkeleton'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }

const COUNTRY_CODES = ['+91', '+1', '+44', '+971', '+61', '+65', '+60']

function getInitials(name) {
  if (!name) return ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const student = useAppSelector(state => state.students.selected?.id === Number(id) ? state.students.selected : state.students.list.find(s => s.id === Number(id)))
  const studentLoading = useAppSelector(state => state.students.loading)
  const courses = useAppSelector(state => state.courses.list)
  const enrollments = useAppSelector(state => state.enrollments.list.filter(e => e.student === Number(id)))

  useEffect(() => {
    dispatch(fetchStudentThunk(id))
    dispatch(fetchCoursesThunk())
    dispatch(fetchEnrollmentsThunk({ student: id }))
  }, [dispatch, id])

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  if (studentLoading && !student) return (
    <PageWrapper title="Student Detail">
      <CardSkeleton count={3} />
    </PageWrapper>
  )

  if (!student) return (
    <PageWrapper title="Student Detail">
      <p className="text-gray-500">Student not found.</p>
    </PageWrapper>
  )

  const studentName = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim()

  const enrolledCourseIds = enrollments.map(e => e.course)
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id))
  const selectedCourse = courses.find(c => c.id === Number(selectedCourseId))

  const onEditSave = async (data) => {
    const result = await dispatch(updateStudentThunk({
      id: student.id,
      data: { first_name: data.first_name, last_name: data.last_name, email: data.email, country_code: data.country_code, phone: data.phone, place: data.place },
    }))
    if (result.meta.requestStatus === 'fulfilled') { toast.success('Student updated'); setEditOpen(false) }
    else toast.error('Failed to update')
  }

  const onDelete = async () => {
    const result = await dispatch(deleteStudentThunk(student.id))
    if (result.meta.requestStatus === 'fulfilled') { toast.success('Student deleted'); navigate('/students') }
    else toast.error('Failed to delete')
  }

  const onEnroll = async () => {
    if (!selectedCourseId) return
    const result = await dispatch(createEnrollmentThunk({
      student: student.id,
      course: selectedCourse.id,
      course_fee: selectedCourse.fee,
      collected_amount: 0,
      enrollment_type: 'direct',
      access_status: 'granted',
    }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(`Enrolled in ${selectedCourse.title}`)
      dispatch(fetchEnrollmentsThunk({ student: id }))
    } else {
      toast.error('Enrollment failed')
    }
    setEnrollOpen(false)
    setSelectedCourseId('')
  }

  const enrollColumns = [
    { header: 'Course', cell: e => <span className="font-medium text-gray-900">{e.course_title}</span> },
    { header: 'Category', cell: e => courses.find(c => c.id === e.course)?.category || '—' },
    { header: 'Fee', cell: e => formatCurrency(e.course_fee) },
    { header: 'Collected', cell: e => formatCurrency(e.collected_amount) },
    { header: 'Balance', cell: e => formatCurrency(e.course_fee - e.collected_amount) },
    { header: 'Status', cell: e => <Badge variant={statusVariant[e.status]}>{e.status}</Badge> },
    { header: 'Date', cell: e => formatDate(e.payment_date) },
  ]

  return (
    <PageWrapper title="Student Detail">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold flex-shrink-0">
          {getInitials(studentName)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{studentName}</h2>
          <p className="text-sm text-gray-500">{student.email}</p>
          <p className="text-sm text-gray-500">{student.country_code} {student.phone}</p>
          {student.place && <p className="text-sm text-gray-500">{student.place}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => { reset({
            first_name: student.first_name || student.name?.split(' ')[0] || '',
            last_name: student.last_name || student.name?.split(' ').slice(1).join(' ') || '',
            email: student.email,
            country_code: student.country_code || '+91',
            phone: student.phone,
            place: student.place || '',
          }); setEditOpen(true) }}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Enrolled Courses</h3>
          <Button size="sm" onClick={() => setEnrollOpen(true)}>+ Enroll in Course</Button>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No enrollments yet</p>
        ) : (
          <Table columns={enrollColumns} data={enrollments} />
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <form onSubmit={handleSubmit(onEditSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              placeholder="First name"
              error={errors.first_name?.message}
              register={n => register(n, { required: 'Required' })}
            />
            <Input
              label="Last Name"
              name="last_name"
              placeholder="Last name"
              error={errors.last_name?.message}
              register={n => register(n, { required: 'Required' })}
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            error={errors.email?.message}
            register={n => register(n, { required: 'Required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex gap-2">
              <select
                {...register('country_code')}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              >
                {COUNTRY_CODES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                {...register('phone', { required: 'Required' })}
                placeholder="Phone number"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <Input
            label="Place"
            name="place"
            placeholder="City / Location"
            register={n => register(n)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <strong>{studentName}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={onDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Enroll Modal */}
      <Modal isOpen={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll in Course" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select a course --</option>
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          {selectedCourse && (
            <div className="bg-indigo-50 rounded-lg px-4 py-3 text-sm text-indigo-800">
              Course Fee: <strong>{formatCurrency(selectedCourse.fee)}</strong>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button onClick={onEnroll} disabled={!selectedCourseId}>Grant Access</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
