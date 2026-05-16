import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch } from '../../hooks/redux'
import { deleteQuizThunk } from '../../store/slices/quizSlice'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'

const PAGE_SIZE = 10

const FILTER_CONFIGS = [
  { key: 'status', label: 'All Statuses', options: ['Published', 'Draft'] },
  { key: 'quiz_type', label: 'All Types', options: ['Normal', 'Live'] },
]

export default function QuizList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })

  const { data, loading, refetch } = useApiQuery(
    (signal) => api.get('quizzes/', {
      params: {
        search: query.search || undefined,
        page: query.page,
        status: query.filters?.status !== 'All' ? query.filters.status : undefined,
        quiz_type: query.filters?.quiz_type !== 'All' ? query.filters.quiz_type : undefined,
      },
      signal,
    }).then(r => r.data),
    [query.search, query.page, query.filters?.status, query.filters?.quiz_type]
  )

  const rows = data?.results ?? []
  const total = data?.count ?? 0

  const handleQuery = useCallback((q) => setQuery(q), [])

  const confirmDelete = async () => {
    const result = await dispatch(deleteQuizThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') { toast.success('Quiz deleted'); refetch() }
    else toast.error('Delete failed')
    setDeleteTarget(null)
  }

  const columns = [
    {
      header: 'Title',
      cell: q => (
        <button onClick={() => navigate(`/quizzes/${q.id}/questions`)} className="font-medium text-indigo-700 hover:underline text-left">
          {q.title}
        </button>
      ),
    },
    {
      header: 'Type',
      cell: q => (
        <Badge variant={q.quiz_type === 'Live' ? 'danger' : 'info'}>
          {q.quiz_type === 'Live' ? 'Live' : 'Normal'}
        </Badge>
      ),
    },
    { header: 'Course', accessor: 'course_title' },
    { header: 'Questions', accessor: 'total_questions' },
    { header: 'Pass Score', cell: q => `${q.pass_score}%` },
    { header: 'Timer', cell: q => `${q.timer_minutes} min` },
    { header: 'Attempts', cell: q => q.attempts === 0 ? 'Unlimited' : q.attempts },
    {
      header: 'Status',
      cell: q => <Badge variant={q.status === 'Published' ? 'success' : 'warning'}>{q.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: q => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/quizzes/${q.id}/questions`)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition" title="View Questions">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => navigate(`/quizzes/${q.id}/edit`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit Quiz">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(q)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete Quiz">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Quizzes">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        loading={loading}
        searchPlaceholder="Search by title or course..."
        filterConfigs={FILTER_CONFIGS}
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={<Button onClick={() => navigate('/quizzes/new')}>+ Create Quiz</Button>}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete quiz <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
