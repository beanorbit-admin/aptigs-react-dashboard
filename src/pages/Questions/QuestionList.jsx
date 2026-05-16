import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch } from '../../hooks/redux'
import { deleteQuestionThunk } from '../../store/slices/questionSlice'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'

const typeBadge = { MCQ: 'info', TrueFalse: 'warning', FillBlank: 'default' }
const PAGE_SIZE = 10

const FILTER_CONFIGS = [
  { key: 'type', label: 'All Types', options: ['MCQ', 'TrueFalse', 'FillBlank'] },
]

export default function QuestionList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, loading, refetch } = useApiQuery(
    (signal) => api.get('questions/', {
      params: {
        search: query.search || undefined,
        page: query.page,
        type: query.filters?.type !== 'All' ? query.filters.type : undefined,
      },
      signal,
    }).then(r => r.data),
    [query.search, query.page, query.filters?.type]
  )

  const rows = data?.results ?? []
  const total = data?.count ?? 0

  const handleQuery = useCallback((q) => setQuery(q), [])

  const confirmDelete = async () => {
    const result = await dispatch(deleteQuestionThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') { toast.success('Question deleted'); refetch() }
    else toast.error('Delete failed')
    setDeleteTarget(null)
  }

  const columns = [
    {
      header: 'Question',
      cell: q => (
        <span className="text-sm text-gray-800 line-clamp-2">
          {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
        </span>
      ),
    },
    {
      header: 'Type',
      cell: q => <Badge variant={typeBadge[q.type]}>{q.type}</Badge>,
    },
    { header: 'Marks', accessor: 'marks' },
    {
      header: 'Actions',
      cell: q => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/questions/${q.id}/edit`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(q)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Questions">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        loading={loading}
        searchPlaceholder="Search questions..."
        filterConfigs={FILTER_CONFIGS}
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={<Button onClick={() => navigate('/questions/new')}>+ Add Question</Button>}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete this question?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
