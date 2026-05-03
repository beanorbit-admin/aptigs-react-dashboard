import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { addTeacher, updateTeacher, deleteTeacher, setTeachers } from '../../store/slices/teacherSlice'
import { teachers as mockTeachers } from '../../mock/teachers'

const PAGE_SIZE = 10

const FILTER_CONFIGS = [
  { key: 'status', label: 'All Statuses', options: ['Active', 'Inactive'] },
]

function genPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
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
  const [tempPassword, setTempPassword] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', courseIds: [] })

  useEffect(() => {
    if (teachers.length === 0) dispatch(setTeachers(mockTeachers))
  }, [dispatch, teachers.length])

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

  const openAdd = () => { setEditTarget(null); setForm({ name: '', email: '', phone: '', courseIds: [] }); setTempPassword(''); setModalOpen(true) }
  const openEdit = (t) => { setEditTarget(t); setForm({ name: t.name, email: t.email, phone: t.phone, courseIds: t.courseIds }); setTempPassword(''); setModalOpen(true) }

  const toggleCourse = (cid) => {
    setForm(f => ({
      ...f,
      courseIds: f.courseIds.includes(cid) ? f.courseIds.filter(id => id !== cid) : [...f.courseIds, cid],
    }))
  }

  const onSave = () => {
    if (!form.name || !form.email) return
    if (editTarget) {
      dispatch(updateTeacher({ ...editTarget, ...form }))
      toast.success('Teacher updated')
      setModalOpen(false)
    } else {
      const pw = genPassword()
      dispatch(addTeacher({ ...form, id: Date.now(), status: 'Active' }))
      setTempPassword(pw)
      toast.success('Teacher added. Share credentials.')
    }
  }

  const confirmDelete = () => {
    dispatch(deleteTeacher(deleteTarget.id))
    toast.success('Teacher deleted')
    setDeleteTarget(null)
  }

  const columns = [
    { header: 'Name', cell: t => <span className="font-medium text-gray-900">{t.name}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Assigned Courses',
      cell: t => (
        <div className="flex flex-wrap gap-1">
          {(t.courseIds || []).map(cid => {
            const c = courses.find(c => c.id === cid)
            return c ? <Badge key={cid} variant="info">{c.title}</Badge> : null
          })}
          {(!t.courseIds || t.courseIds.length === 0) && <span className="text-xs text-gray-400">None</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: t => <Badge variant={t.status === 'Active' ? 'success' : 'default'}>{t.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: t => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/teachers/${t.id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"><Eye className="h-4 w-4" /></button>
          <button onClick={() => openEdit(t)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="h-4 w-4" /></button>
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Teacher' : 'Add Teacher'}>
        <div className="space-y-4">
          {['name', 'email', 'phone'].map(field => (
            <div key={field}>
              <label className="text-sm font-medium text-gray-700 block mb-1 capitalize">{field}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Assign Courses</label>
            <div className="flex flex-wrap gap-2">
              {courses.map(c => (
                <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${form.courseIds.includes(c.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {c.title}
                </button>
              ))}
            </div>
          </div>
          {tempPassword && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Share these credentials with the teacher:</p>
              <div className="flex items-center gap-2">
                <input readOnly value={tempPassword} className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success('Copied!') }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
            {!tempPassword && <Button onClick={onSave}>{editTarget ? 'Update' : 'Add Teacher'}</Button>}
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete teacher <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
