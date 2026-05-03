import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
import { updateStudent, deleteStudent } from '../../store/slices/studentSlice'
import { addEnrollment } from '../../store/slices/enrollmentSlice'
import { formatCurrency, formatDate } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }

const COUNTRY_CODES = ['+91', '+1', '+44', '+971', '+61', '+65', '+60']

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const student = useAppSelector(state => state.students.list.find(s => s.id === Number(id)))
  const courses = useAppSelector(state => state.courses.list)
  const enrollments = useAppSelector(state => state.enrollments.list.filter(e => e.studentId === Number(id)))

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  if (!student) return (
    <PageWrapper title="Student Detail">
      <p className="text-gray-500">Student not found.</p>
    </PageWrapper>
  )

  const enrolledCourseIds = enrollments.map(e => e.courseId)
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id))
  const selectedCourse = courses.find(c => c.id === Number(selectedCourseId))

  const onEditSave = (data) => {
    dispatch(updateStudent({
      ...student,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      place: data.place,
    }))
    toast.success('Student updated')
    setEditOpen(false)
  }

  const onDelete = () => {
    dispatch(deleteStudent(student.id))
    toast.success('Student deleted')
    navigate('/students')
  }

  const onEnroll = () => {
    if (!selectedCourseId) return
    dispatch(addEnrollment({
      id: Date.now(),
      studentId: student.id,
      studentName: student.name,
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      courseFee: selectedCourse.fee,
      collectedAmount: 0,
      paymentDate: null,
      status: 'Pending',
      accessStatus: 'granted',
      enrollmentType: 'direct',
    }))
    toast.success(`Enrolled in ${selectedCourse.title}`)
    setEnrollOpen(false)
    setSelectedCourseId('')
  }

  const enrollColumns = [
    { header: 'Course', cell: e => <span className="font-medium text-gray-900">{e.courseName}</span> },
    { header: 'Category', cell: e => courses.find(c => c.id === e.courseId)?.category || '—' },
    { header: 'Fee', cell: e => formatCurrency(e.courseFee) },
    { header: 'Collected', cell: e => formatCurrency(e.collectedAmount) },
    { header: 'Balance', cell: e => formatCurrency(e.courseFee - e.collectedAmount) },
    { header: 'Status', cell: e => <Badge variant={statusVariant[e.status]}>{e.status}</Badge> },
    { header: 'Date', cell: e => formatDate(e.paymentDate) },
  ]

  return (
    <PageWrapper title="Student Detail">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-start gap-6 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold flex-shrink-0">
          {getInitials(student.name)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500">{student.email}</p>
          <p className="text-sm text-gray-500">{student.countryCode} {student.phone}</p>
          {student.place && <p className="text-sm text-gray-500">{student.place}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => { reset({
            firstName: student.firstName || student.name.split(' ')[0],
            lastName: student.lastName || student.name.split(' ').slice(1).join(' '),
            email: student.email,
            countryCode: student.countryCode || '+91',
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
              name="firstName"
              placeholder="First name"
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Required' })}
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Last name"
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Required' })}
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            error={errors.email?.message}
            {...register('email', { required: 'Required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex gap-2">
              <select
                {...register('countryCode')}
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
            {...register('place')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <strong>{student.name}</strong>?</p>
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
