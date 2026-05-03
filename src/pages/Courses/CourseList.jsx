import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { addCourse, updateCourse, deleteCourse } from '../../store/slices/courseSlice'
import { formatCurrency } from '../../utils/formatters'
import CourseFormModal from './CourseFormModal'

const PAGE_SIZE = 10

export default function CourseList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const courses = useAppSelector(state => state.courses.list)
  const categories = useAppSelector(state => state.courses.categories)

  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filterConfigs = useMemo(() => [
    { key: 'category', label: 'All Categories', options: categories.map(c => c.name) },
    { key: 'status', label: 'All Statuses', options: ['Active', 'Inactive'] },
  ], [categories])

  const { rows, total } = useMemo(() => {
    const s = (query.search || '').toLowerCase()
    const { category = 'All', status = 'All' } = query.filters || {}
    const filtered = courses.filter(c => {
      if (s && !c.title.toLowerCase().includes(s)) return false
      if (category !== 'All' && c.category !== category) return false
      if (status !== 'All' && c.status !== status) return false
      return true
    })
    return {
      rows: filtered.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [courses, query])

  const handleQuery = useCallback((q) => setQuery(q), [])

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (c) => { setEditTarget(c); setModalOpen(true) }

  const onSave = (data) => {
    const cat = categories.find(c => c.id === Number(data.categoryId))
    if (editTarget) {
      dispatch(updateCourse({ ...editTarget, ...data, category: cat?.name || '' }))
      toast.success('Course updated')
    } else {
      dispatch(addCourse({ ...data, id: Date.now(), category: cat?.name || '', teacherIds: data.teacherIds || [] }))
      toast.success('Course added')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    dispatch(deleteCourse(deleteTarget.id))
    toast.success('Course deleted')
    setDeleteTarget(null)
  }

  const columns = [
    { header: 'Title', cell: c => <span className="font-medium text-gray-900">{c.title}</span> },
    { header: 'Category', accessor: 'category' },
    { header: 'Duration', accessor: 'duration' },
    { header: 'Fee', cell: c => formatCurrency(c.fee) },
    {
      header: 'Status',
      cell: c => <Badge variant={c.status === 'Active' ? 'success' : 'default'}>{c.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: c => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/courses/${c.id}`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition" title="View enrollments"><Eye className="h-4 w-4" /></button>
          <button onClick={() => navigate(`/courses/${c.id}/content`)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition" title="Manage content"><Layers className="h-4 w-4" /></button>
          <button onClick={() => openEdit(c)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Courses">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        searchPlaceholder="Search courses..."
        filterConfigs={filterConfigs}
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/courses/categories')} className="text-sm text-indigo-600 hover:underline">
              Manage Categories
            </button>
            <Button onClick={openAdd}>+ Add Course</Button>
          </div>
        }
      />

      <CourseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
        editTarget={editTarget}
        categories={categories}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete course <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
