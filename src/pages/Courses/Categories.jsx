import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import SearchInput from '../../components/common/SearchInput'
import SkeletonRow from '../../components/common/SkeletonRow'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchCoursesThunk, createCategoryThunk, updateCategoryThunk, deleteCategoryThunk } from '../../store/slices/courseSlice'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'

export default function Categories() {
  const dispatch = useAppDispatch()
  const courses = useAppSelector(state => state.courses.list)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [name, setName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { dispatch(fetchCoursesThunk()) }, [dispatch])

  const { data, loading, refetch } = useApiQuery(
    (signal) => api.get('categories/', {
      params: { search: search || undefined },
      signal,
    }).then(r => r.data),
    [search]
  )

  const categories = Array.isArray(data) ? data : (data?.results ?? [])

  const openAdd = () => { setEditTarget(null); setName(''); setModalOpen(true) }
  const openEdit = (cat) => { setEditTarget(cat); setName(cat.name); setModalOpen(true) }

  const onSave = async () => {
    if (!name.trim()) return
    const result = editTarget
      ? await dispatch(updateCategoryThunk({ id: editTarget.id, data: { name: name.trim() } }))
      : await dispatch(createCategoryThunk({ name: name.trim() }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editTarget ? 'Category updated' : 'Category added')
      setModalOpen(false)
      refetch()
    } else {
      toast.error('Save failed')
    }
  }

  const confirmDelete = async () => {
    const result = await dispatch(deleteCategoryThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') { toast.success('Category deleted'); refetch() }
    else toast.error('Delete failed')
    setDeleteTarget(null)
  }

  const columns = [
    { header: '#', cell: (_, idx) => idx + 1 },
    { header: 'Category Name', accessor: 'name', cell: r => <span className="font-medium text-gray-900">{r.name}</span> },
    {
      header: 'Course Count',
      cell: r => {
        const count = courses.filter(c => c.category === r.id).length
        return <span className="text-gray-600">{count} course{count !== 1 ? 's' : ''}</span>
      }
    },
    {
      header: 'Actions',
      cell: r => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="h-4 w-4" /></button>
        </div>
      )
    },
  ]

  return (
    <PageWrapper title="Course Categories">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{loading ? '...' : categories.length} categories</p>
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories..." />
        </div>
        <Button onClick={openAdd}>+ Add Category</Button>
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <SkeletonRow cols={columns.length} rows={5} />
            </tbody>
          </table>
        </div>
      ) : (
        <Table columns={columns} data={categories} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. UG, PG, Diploma"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={onSave}>{editTarget ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete category <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
