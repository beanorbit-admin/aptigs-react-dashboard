import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setQuizzes, deleteQuiz } from '../../store/slices/quizSlice'
import { setQuestions } from '../../store/slices/questionSlice'
import { quizzes as mockQuizzes } from '../../mock/quizzes'
import { questions as mockQuestions } from '../../mock/questions'

const PAGE_SIZE = 10

const FILTER_CONFIGS = [
  { key: 'status', label: 'All Statuses', options: ['Published', 'Draft'] },
]

export default function QuizList() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const quizzes = useAppSelector(state => state.quizzes.list)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })

  useEffect(() => {
    if (quizzes.length === 0) dispatch(setQuizzes(mockQuizzes))
    dispatch(setQuestions(mockQuestions))
  }, [dispatch, quizzes.length])

  const { rows, total } = useMemo(() => {
    const s = (query.search || '').toLowerCase()
    const { status = 'All' } = query.filters || {}
    const filtered = quizzes.filter(q => {
      if (s && ![q.title, q.courseName].some(v => (v || '').toLowerCase().includes(s))) return false
      if (status !== 'All' && q.status !== status) return false
      return true
    })
    return {
      rows: filtered.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [quizzes, query])

  const handleQuery = useCallback((q) => setQuery(q), [])

  const confirmDelete = () => {
    dispatch(deleteQuiz(deleteTarget.id))
    toast.success('Quiz deleted')
    setDeleteTarget(null)
  }

  const columns = [
    { header: 'Title', cell: q => <span className="font-medium text-gray-900">{q.title}</span> },
    { header: 'Course', accessor: 'courseName' },
    { header: 'Questions', accessor: 'totalQuestions' },
    { header: 'Pass Score', cell: q => `${q.passScore}%` },
    { header: 'Timer', cell: q => `${q.timerMinutes} min` },
    { header: 'Attempts', cell: q => q.attempts === 0 ? 'Unlimited' : q.attempts },
    {
      header: 'Status',
      cell: q => <Badge variant={q.status === 'Published' ? 'success' : 'warning'}>{q.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: q => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/quizzes/${q.id}/edit`)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
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
    <PageWrapper title="Quizzes">
      <DataTable
        columns={columns}
        data={rows}
        total={total}
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
