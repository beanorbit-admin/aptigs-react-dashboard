import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, Copy, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchTeachersThunk, createTeacherThunk, updateTeacherThunk, deleteTeacherThunk, resetTeacherPasswordThunk } from '../../store/slices/teacherSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'

const PAGE_SIZE = 10
const FILTER_CONFIGS = [
  { key: 'status', label: 'All Statuses', options: ['Active', 'Inactive'] },
]

function genPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export default function TeacherList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const teachers = useAppSelector(state => state.teachers.list)
  const courses = useAppSelector(state => state.courses.list)

  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [courseIds, setCourseIds] = useState([])
  const [isActive, setIsActive] = useState(true)
  const [credentials, setCredentials] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    dispatch(fetchTeachersThunk())
    dispatch(fetchCoursesThunk())
  }, [dispatch])

  const { rows, total } = useMemo(() => {
    const s = (query.search || '').toLowerCase()
    const { status = 'All' } = query.filters || {}
    const filtered = teachers.filter(t => {
      if (s && ![t.name, t.email].some(v => (v || '').toLowerCase().includes(s))) return false
      if (status !== 'All' && t.status !== status) return false
      return true
    })
    return {
      rows: filtered.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [teachers, query])

  const handleQuery = useCallback((q) => setQuery(q), [])

  const openAdd = () => {
    setEditTarget(null)
    setCredentials(null)
    setCourseIds([])
    setIsActive(true)
    reset({ name: '', email: '', phone: '', password: '' })
    setModalOpen(true)
  }

  const openEdit = (t) => {
    setEditTarget(t)
    setCredentials(null)
    setCourseIds([])
    setIsActive(t.status === 'Active')
    reset({ name: t.name, email: t.email, phone: t.phone, password: '' })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setCredentials(null) }

  const toggleCourse = (cid) =>
    setCourseIds(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid])

  const onSave = async (data) => {
    const payload = {
      first_name: data.name.split(' ')[0],
      last_name: data.name.split(' ').slice(1).join(' ') || '',
      email: data.email,
      country_code: '+91',
      phone: data.phone,
      status: isActive ? 'Active' : 'Inactive',
      password: data.password || undefined,
    }
    if (editTarget) {
      const result = await dispatch(updateTeacherThunk({ id: editTarget.id, data: payload }))
      if (result.meta.requestStatus === 'fulfilled') { toast.success('Teacher updated'); closeModal() }
      else toast.error('Update failed')
    } else {
      const result = await dispatch(createTeacherThunk(payload))
      if (result.meta.requestStatus === 'fulfilled') {
        setCredentials({ email: data.email, password: data.password })
        toast.success('Teacher added — share credentials')
      } else {
        toast.error('Failed to add teacher')
      }
    }
  }

  const confirmDelete = async () => {
    const result = await dispatch(deleteTeacherThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') toast.success('Teacher deleted')
    else toast.error('Delete failed')
    setDeleteTarget(null)
  }

  const columns = [
    { header: 'Name', cell: t => <span className="font-medium text-gray-900">{t.name}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', cell: t => <span className="text-sm text-gray-700">{t.country_code || '+91'} {t.phone}</span> },
    {
      header: 'Status',
      cell: t => <Badge variant={t.status === 'Active' ? 'success' : 'default'}>{t.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: t => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/teachers/${t.id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition" title="View"><Eye className="h-4 w-4" /></button>
          <button onClick={() => openEdit(t)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Teacher Management">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        searchPlaceholder="Search by name or email..."
        filterConfigs={FILTER_CONFIGS}
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={<Button onClick={openAdd}>+ Add Teacher</Button>}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={credentials ? 'Teacher Added' : editTarget ? 'Edit Teacher' : 'Add Teacher'}
      >
        {credentials ? (
          /* ── Credentials view ── */
          <div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 text-center mb-5">
              Teacher account created. Share these login credentials:
            </p>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Email', value: credentials.email },
                { label: 'Password', value: credentials.password, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={value}
                      className={`flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`}
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`) }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={openAdd}>Add Another</Button>
              <Button onClick={closeModal}>Done</Button>
            </div>
          </div>
        ) : (
          /* ── Form view ── */
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g. Ravi Kumar"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                type="email"
                placeholder="e.g. ravi@school.com"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Phone with fixed +91 */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm font-medium text-gray-600 select-none">
                  +91
                </span>
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: { value: /^\d{7,12}$/, message: 'Enter a 7–12 digit number' },
                  })}
                  placeholder="9811223344"
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            {/* Active status */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-400 mt-0.5">Teacher can log in when active</p>
              </div>
              <ToggleSwitch checked={isActive} onChange={setIsActive} />
            </div>

            {/* Assign courses */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Assign Courses</label>
              {courses.length === 0 ? (
                <p className="text-xs text-gray-400">No courses available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {courses.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCourse(c.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        courseIds.includes(c.id)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {editTarget ? 'Change Password' : 'Set Password'}
                {editTarget && (
                  <span className="text-xs text-gray-400 font-normal ml-2">Leave blank to keep current</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  {...register('password', editTarget
                    ? {}
                    : { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } }
                  )}
                  type="text"
                  placeholder={editTarget ? 'Enter new password to change' : 'Set login password'}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setValue('password', genPassword())}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition whitespace-nowrap"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Generate
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
              <Button type="submit">{editTarget ? 'Update Teacher' : 'Add Teacher'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          Delete teacher <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
