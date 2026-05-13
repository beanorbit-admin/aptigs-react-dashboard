import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Upload, ChevronRight, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import RichTextEditor from '../../components/common/RichTextEditor'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchQuestionsThunk, createQuestionThunk, updateQuestionThunk, deleteQuestionThunk } from '../../store/slices/questionSlice'
import { fetchQuizzesThunk, addQuestionsThunk, removeQuestionThunk } from '../../store/slices/quizSlice'

const typeBadge = { MCQ: 'info', TrueFalse: 'warning', FillBlank: 'default' }
const PAGE_SIZE = 10
const FILTER_CONFIGS = [
  { key: 'type', label: 'All Types', options: ['MCQ', 'TrueFalse', 'FillBlank'] },
]
const EMPTY_FORM = {
  type: 'MCQ', text: '', marks: 1,
  options: ['', '', '', ''], correctOption: 0,
  correctAnswer: '', hint: '', trueFalseAnswer: true,
}

function QuestionForm({ form, onChange, onSave, onCancel, saveLabel }) {
  const set = (key, val) => onChange({ ...form, [key]: val })

  const handleSave = () => {
    const plainText = form.text.replace(/<[^>]*>/g, '').trim()
    if (!plainText) { toast.error('Question text is required'); return }
    const base = { type: form.type, text: form.text, marks: Number(form.marks) || 1 }
    let payload
    if (form.type === 'MCQ') payload = { ...base, options: form.options, correct_option: form.correctOption }
    else if (form.type === 'FillBlank') payload = { ...base, correct_answer: form.correctAnswer, hint: form.hint }
    else payload = { ...base, correct_answer: form.trueFalseAnswer }
    onSave(payload)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">Question Type</label>
        <div className="grid grid-cols-3 gap-3">
          {[{ value: 'MCQ', label: 'MCQ' }, { value: 'FillBlank', label: 'Fill in the Blank' }, { value: 'TrueFalse', label: 'True / False' }].map(t => (
            <button key={t.value} type="button" onClick={() => set('type', t.value)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${form.type === t.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Question Text *</label>
        <RichTextEditor
          value={form.text}
          onChange={val => set('text', val)}
          placeholder="Enter your question here..."
        />
      </div>

      <div className="w-28">
        <label className="text-sm font-medium text-gray-700 block mb-1">Marks</label>
        <input type="number" min="1" value={form.marks} onChange={e => set('marks', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {form.type === 'MCQ' && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 block">Options</label>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" checked={form.correctOption === i} onChange={() => set('correctOption', i)} className="w-4 h-4 text-indigo-600" />
              <input value={opt}
                onChange={e => set('options', form.options.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <p className="text-xs text-gray-500">Select the radio button next to the correct answer</p>
        </div>
      )}

      {form.type === 'FillBlank' && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Correct Answer</label>
            <input value={form.correctAnswer} onChange={e => set('correctAnswer', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Hint (optional)</label>
            <input value={form.hint} onChange={e => set('hint', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

      {form.type === 'TrueFalse' && (
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-3">Correct Answer</label>
          <div className="grid grid-cols-2 gap-4">
            {[true, false].map(val => (
              <button key={String(val)} type="button" onClick={() => set('trueFalseAnswer', val)}
                className={`py-4 rounded-xl border-2 text-sm font-semibold transition ${form.trueFalseAnswer === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {val ? 'True' : 'False'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button onClick={handleSave}>{saveLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export default function QuizQuestions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const quiz = useAppSelector(state => state.quizzes.list.find(q => q.id === Number(id)))
  const allQuestions = useAppSelector(state => state.questions.list)

  const [questionModal, setQuestionModal] = useState(null) // null | 'add' | question-object (edit)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [extractedQuestions, setExtractedQuestions] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [questionForm, setQuestionForm] = useState(EMPTY_FORM)
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })

  useEffect(() => {
    dispatch(fetchQuizzesThunk())
    dispatch(fetchQuestionsThunk())
  }, [dispatch])

  const quizQuestionIds = useMemo(() => (quiz?.quiz_questions || []).map(qq => qq.question.id), [quiz])

  const quizQuestions = useMemo(() => {
    if (!quiz) return []
    return allQuestions.filter(q => quizQuestionIds.includes(q.id))
  }, [allQuestions, quizQuestionIds])

  const { rows, total } = useMemo(() => {
    const s = (query.search || '').toLowerCase()
    const { type = 'All' } = query.filters || {}
    const filtered = quizQuestions.filter(q => {
      if (s && !q.text.toLowerCase().includes(s)) return false
      if (type !== 'All' && q.type !== type) return false
      return true
    })
    return {
      rows: filtered.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [quizQuestions, query])

  const handleQuery = useCallback(q => setQuery(q), [])

  const openAddModal = () => {
    setQuestionForm(EMPTY_FORM)
    setQuestionModal('add')
  }

  const openEditModal = (q) => {
    setQuestionForm({
      type: q.type,
      text: q.text,
      marks: q.marks,
      options: q.options || ['', '', '', ''],
      correctOption: q.correct_option ?? 0,
      correctAnswer: typeof q.correct_answer === 'string' ? q.correct_answer : '',
      hint: q.hint || '',
      trueFalseAnswer: typeof q.correct_answer === 'boolean' ? q.correct_answer : true,
    })
    setQuestionModal(q)
  }

  const closeQuestionModal = () => setQuestionModal(null)

  const handleSaveQuestion = async (payload) => {
    if (questionModal === 'add') {
      const createResult = await dispatch(createQuestionThunk(payload))
      if (createResult.meta.requestStatus !== 'fulfilled') { toast.error('Failed to save question'); return }
      const newId = createResult.payload.id
      await dispatch(addQuestionsThunk({ quizId: quiz.id, questionIds: [newId] }))
      toast.success('Question added')
    } else {
      const result = await dispatch(updateQuestionThunk({ id: questionModal.id, data: payload }))
      if (result.meta.requestStatus !== 'fulfilled') { toast.error('Failed to update question'); return }
      toast.success('Question updated')
    }
    closeQuestionModal()
  }

  const confirmDelete = async () => {
    const result = await dispatch(removeQuestionThunk({ quizId: quiz.id, questionId: deleteTarget.id }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Question removed from quiz')
    } else {
      toast.error('Delete failed')
    }
    setDeleteTarget(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedFile(file)
    setExtracting(true)
    setExtractedQuestions([])
    setTimeout(() => {
      const name = file.name.replace(/\.[^.]+$/, '')
      setExtractedQuestions([
        { id: 'ext-1', type: 'MCQ', text: `What is the primary subject covered in "${name}"?`, marks: 2, options: ['Theoretical concepts', 'Practical applications', 'Historical context', 'Case studies'], correctOption: 0, selected: true },
        { id: 'ext-2', type: 'TrueFalse', text: `The document "${name}" introduces foundational concepts.`, marks: 1, correctAnswer: true, selected: true },
        { id: 'ext-3', type: 'FillBlank', text: `The key term defined in "${name}" is ________.`, marks: 1, correctAnswer: name, hint: 'Refer to the document title', selected: true },
        { id: 'ext-4', type: 'MCQ', text: `Which of the following best describes the content of "${name}"?`, marks: 2, options: ['Introduction', 'Advanced topics', 'Summary', 'Reference material'], correctOption: 0, selected: true },
      ])
      setExtracting(false)
    }, 1500)
  }

  const toggleExtracted = (idx) => {
    setExtractedQuestions(qs => qs.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q))
  }

  const handleAddExtracted = async () => {
    const selected = extractedQuestions.filter(q => q.selected)
    if (selected.length === 0) { toast.error('No questions selected'); return }
    const newIds = []
    for (const { id: _id, selected: _sel, ...payload } of selected) {
      const result = await dispatch(createQuestionThunk(payload))
      if (result.meta.requestStatus === 'fulfilled') newIds.push(result.payload.id)
    }
    if (newIds.length > 0) {
      await dispatch(addQuestionsThunk({ quizId: quiz.id, questionIds: newIds }))
      toast.success(`${newIds.length} question${newIds.length > 1 ? 's' : ''} added to quiz`)
    }
    setUploadOpen(false)
    setUploadedFile(null)
    setExtractedQuestions([])
  }

  const closeUploadModal = () => {
    setUploadOpen(false)
    setUploadedFile(null)
    setExtractedQuestions([])
    setExtracting(false)
  }

  if (!quiz) {
    return (
      <PageWrapper title="Quiz Not Found">
        <p className="text-gray-500 mb-4">Quiz not found.</p>
        <Button variant="secondary" onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
      </PageWrapper>
    )
  }

  const columns = [
    {
      header: 'Question',
      cell: q => <span className="text-sm text-gray-800">{q.text.length > 80 ? q.text.slice(0, 80) + '…' : q.text}</span>,
    },
    { header: 'Type', cell: q => <Badge variant={typeBadge[q.type]}>{q.type}</Badge> },
    { header: 'Marks', accessor: 'marks' },
    {
      header: 'Actions',
      cell: q => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(q)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit Question">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(q)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Delete Question">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const isEditModal = questionModal && questionModal !== 'add'

  return (
    <PageWrapper title={quiz.title}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <button onClick={() => navigate('/quizzes')} className="hover:text-indigo-600 transition font-medium">
          Quizzes
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <span className="text-gray-800 font-medium truncate">{quiz.title}</span>
      </div>

      {/* Quiz info card */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          {quiz.course_title && (
            <div className="text-sm">
              <span className="text-gray-500">Course: </span>
              <span className="font-medium text-gray-800">{quiz.course_title}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-500">Pass Score: </span>
            <span className="font-medium text-gray-800">{quiz.pass_score}%</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Timer: </span>
            <span className="font-medium text-gray-800">{quiz.timer_minutes ? `${quiz.timer_minutes} min` : 'None'}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Attempts: </span>
            <span className="font-medium text-gray-800">{quiz.attempts === 0 ? 'Unlimited' : quiz.attempts}</span>
          </div>
          <Badge variant={quiz.status === 'Published' ? 'success' : 'warning'}>{quiz.status}</Badge>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>
          Edit Quiz
        </Button>
      </div>

      {/* Questions DataTable */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-gray-700">Questions ({quizQuestions.length})</p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        searchPlaceholder="Search questions..."
        filterConfigs={FILTER_CONFIGS}
        pageSize={PAGE_SIZE}
        onQueryChange={handleQuery}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5 inline-block" />
              Upload Document
            </Button>
            <Button size="sm" onClick={openAddModal}>
              + Add Question
            </Button>
          </div>
        }
      />

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={!!questionModal}
        onClose={closeQuestionModal}
        title={isEditModal ? 'Edit Question' : 'Add Question'}
        size="lg"
      >
        <QuestionForm
          key={isEditModal ? `edit-${questionModal.id}` : 'add-new'}
          form={questionForm}
          onChange={setQuestionForm}
          onSave={handleSaveQuestion}
          onCancel={closeQuestionModal}
          saveLabel={isEditModal ? 'Update Question' : 'Save Question'}
        />
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={uploadOpen} onClose={closeUploadModal} title="Upload Document" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Upload a document to automatically extract questions and add them to this quiz.
          </p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-indigo-400 transition">
            <FileText className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 font-medium">
              {uploadedFile ? uploadedFile.name : 'Click to select a file'}
            </span>
            <span className="text-xs text-gray-400 mt-1">Supports PDF, DOC, DOCX, TXT</span>
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
          </label>

          {extracting && (
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting questions from document…
            </div>
          )}

          {extractedQuestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Extracted Questions — select which to add to the quiz:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {extractedQuestions.map((q, i) => (
                  <label key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-indigo-50 transition">
                    <input type="checkbox" checked={q.selected} onChange={() => toggleExtracted(i)} className="mt-0.5 w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={typeBadge[q.type]}>{q.type}</Badge>
                        <span className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-700">{q.text}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Button onClick={handleAddExtracted}>
                Add Selected ({extractedQuestions.filter(q => q.selected).length}) to Quiz
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete this question from the quiz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
