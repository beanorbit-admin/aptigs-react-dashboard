import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { updateStudent, deleteStudent } from '../../store/slices/studentSlice'

const PAGE_SIZE = 10

export default function StudentList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const students = useAppSelector(state => state.students.list)

  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { rows, total } = useMemo(() => {
    const s = (query.search || '').toLowerCase()
    const filtered = s
      ? students.filter(st =>
          [st.firstName, st.lastName, st.name, st.email].some(v =>
            (v || '').toLowerCase().includes(s)
          )
        )
      : students
    return {
      rows: filtered.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [students, query])

  const handleQuery = useCallback((q) => setQuery(q), [])

  const openEdit = (student) => { setEditTarget(student); reset(student); setModalOpen(true) }

  const onSave = (data) => {
    dispatch(updateStudent({
      ...editTarget,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      place: data.place,
    }))
    toast.success('Student updated')
    setModalOpen(false)
    reset()
  }

  const confirmDelete = () => {
    dispatch(deleteStudent(deleteTarget.id))
    toast.success('Student deleted')
    setDeleteTarget(null)
  }

  const columns = [
    {
      header: '#',
      cell: (_, idx) => (query.page - 1) * PAGE_SIZE + idx + 1,
    },
    {
      header: 'Name',
      cell: r => <span className="font-medium text-gray-900">{r.name || `${r.firstName} ${r.lastName}`}</span>,
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Phone',
      cell: r => <span>{r.countryCode} {r.phone}</span>,
    },
    { header: 'Place', accessor: 'place' },
    {
      header: 'Enrolled Courses',
      cell: r => (
        <Badge variant={r.enrolledCourses.length > 0 ? 'info' : 'default'}>
          {r.enrolledCourses.length} course{r.enrolledCourses.length !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: r => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/students/${r.id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition" title="View">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Students">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        searchPlaceholder="Search by name or email..."
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={<Button onClick={() => navigate('/students/new')}>+ Add Student</Button>}
      />

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit Student">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
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
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
            })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex gap-2">
              <select
                {...register('countryCode')}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              >
                {['+91', '+1', '+44', '+971', '+61', '+65', '+60'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: { value: /^\d{6,15}$/, message: 'Enter 6–15 digits' },
                })}
                placeholder="Phone number"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <Input
            label="Place"
            name="place"
            placeholder="City / Location"
            error={errors.place?.message}
            {...register('place', { required: 'Place is required' })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
