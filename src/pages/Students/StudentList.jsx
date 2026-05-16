import { useState, useCallback } from 'react'
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
import { useAppDispatch } from '../../hooks/redux'
import { updateStudentThunk, deleteStudentThunk } from '../../store/slices/studentSlice'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'

const PAGE_SIZE = 10

export default function StudentList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data, loading, refetch } = useApiQuery(
    (signal) => api.get('auth/students/', {
      params: { search: query.search || undefined, page: query.page },
      signal,
    }).then(r => r.data),
    [query.search, query.page]
  )

  const rows = data?.results ?? []
  const total = data?.count ?? 0

  const handleQuery = useCallback((q) => setQuery(q), [])

  const openEdit = (student) => { setEditTarget(student); reset(student); setModalOpen(true) }

  const onSave = async (data) => {
    const result = await dispatch(updateStudentThunk({
      id: editTarget.id,
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        country_code: data.country_code,
        phone: data.phone,
        place: data.place,
      },
    }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Student updated')
      setModalOpen(false)
      reset()
      refetch()
    } else {
      toast.error('Failed to update student')
    }
  }

  const confirmDelete = async () => {
    const result = await dispatch(deleteStudentThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Student deleted')
      refetch()
    } else {
      toast.error('Failed to delete student')
    }
    setDeleteTarget(null)
  }

  const columns = [
    {
      header: '#',
      cell: (_, idx) => (query.page - 1) * PAGE_SIZE + idx + 1,
    },
    {
      header: 'Name',
      cell: r => <span className="font-medium text-gray-900">{r.name || `${r.first_name} ${r.last_name}`}</span>,
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Phone',
      cell: r => <span>{r.country_code} {r.phone}</span>,
    },
    { header: 'Place', accessor: 'place' },
    {
      header: 'Enrolled Courses',
      cell: r => (
        <Badge variant={(r.enrolled_courses?.length ?? 0) > 0 ? 'info' : 'default'}>
          {r.enrolled_courses?.length ?? 0} course{(r.enrolled_courses?.length ?? 0) !== 1 ? 's' : ''}
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
        loading={loading}
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
            placeholder="email@example.com"
            error={errors.email?.message}
            register={n => register(n, { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex gap-2">
              <select
                {...register('country_code')}
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
            register={n => register(n, { required: 'Place is required' })}
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
