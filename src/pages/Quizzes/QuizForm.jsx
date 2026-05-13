import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchQuizzesThunk, createQuizThunk, updateQuizThunk, addQuestionsThunk } from '../../store/slices/quizSlice'
import { fetchQuestionsThunk } from '../../store/slices/questionSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'

export default function QuizForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEdit = Boolean(id)

  const quizzes = useAppSelector(state => state.quizzes.list)
  const courses = useAppSelector(state => state.courses.list)
  const allQuestions = useAppSelector(state => state.questions.list)

  const existing = isEdit ? quizzes.find(q => q.id === Number(id)) : null

  const [form, setForm] = useState({
    title: '', courseId: '', description: '', timerEnabled: false,
    timerMinutes: 30, passScore: 60, attempts: 2,
    questionIds: [],
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [qSearch, setQSearch] = useState('')

  useEffect(() => {
    dispatch(fetchCoursesThunk())
    dispatch(fetchQuestionsThunk())
    if (isEdit) dispatch(fetchQuizzesThunk())
  }, [dispatch, isEdit])

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        courseId: existing.course || '',
        description: existing.description || '',
        timerEnabled: !!existing.timer_minutes,
        timerMinutes: existing.timer_minutes || 30,
        passScore: existing.pass_score || 60,
        attempts: existing.attempts || 2,
        questionIds: (existing.quiz_questions || []).map(qq => qq.question.id),
      })
    }
  }, [existing])

  const selectedQuestions = allQuestions.filter(q => form.questionIds.includes(q.id))
  const filteredQuestions = allQuestions.filter(q =>
    q.text.toLowerCase().includes(qSearch.toLowerCase())
  )

  const toggleQuestion = (qid) => {
    setForm(f => ({
      ...f,
      questionIds: f.questionIds.includes(qid)
        ? f.questionIds.filter(id => id !== qid)
        : [...f.questionIds, qid]
    }))
  }

  const removeQuestion = (qid) => setForm(f => ({ ...f, questionIds: f.questionIds.filter(id => id !== qid) }))

  const handleSave = async (status) => {
    if (!form.title) { toast.error('Quiz title is required'); return }
    const payload = {
      title: form.title,
      course: Number(form.courseId),
      description: form.description,
      timer_minutes: form.timerEnabled ? Number(form.timerMinutes) : 0,
      pass_score: Number(form.passScore),
      attempts: Number(form.attempts),
      status,
    }
    const result = isEdit
      ? await dispatch(updateQuizThunk({ id: existing.id, data: payload }))
      : await dispatch(createQuizThunk(payload))

    if (result.meta.requestStatus === 'fulfilled') {
      const quizId = result.payload.id
      if (form.questionIds.length > 0) {
        await dispatch(addQuestionsThunk({ quizId, questionIds: form.questionIds }))
      }
      toast.success(isEdit ? 'Quiz updated' : 'Quiz created')
      navigate('/quizzes')
    } else {
      toast.error('Save failed')
    }
  }

  const typeBadge = { MCQ: 'info', TrueFalse: 'warning', FillBlank: 'default' }

  return (
    <PageWrapper title={isEdit ? 'Edit Quiz' : 'Create Quiz'}>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Quiz Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Linked Course</label>
            <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Passing Score (%)</label>
              <input type="number" min="0" max="100" value={form.passScore} onChange={e => setForm(f => ({ ...f, passScore: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Attempts (0 = unlimited)</label>
              <input type="number" min="0" value={form.attempts} onChange={e => setForm(f => ({ ...f, attempts: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-medium text-gray-700">Timer</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, timerEnabled: !f.timerEnabled }))}
                className={`relative w-10 h-5 rounded-full transition ${form.timerEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.timerEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {form.timerEnabled && (
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={form.timerMinutes} onChange={e => setForm(f => ({ ...f, timerMinutes: Number(e.target.value) }))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-800">Questions ({selectedQuestions.length})</h3>
            <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>+ Add Questions</Button>
          </div>
          {selectedQuestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No questions added</p>
          ) : (
            <ul className="space-y-2">
              {selectedQuestions.map(q => (
                <li key={q.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                  <Badge variant={typeBadge[q.type]}>{q.type}</Badge>
                  <span className="flex-1 text-sm text-gray-700 truncate">{q.text}</span>
                  <span className="text-xs text-gray-500">{q.marks} mk</span>
                  <button onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => handleSave('Draft')}>Save as Draft</Button>
          <Button onClick={() => handleSave('Published')}>Publish</Button>
          <Button variant="ghost" onClick={() => navigate('/quizzes')}>Cancel</Button>
        </div>
      </div>

      {/* Question Picker Modal */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Add Questions" size="lg">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="Search questions..."
              className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredQuestions.map(q => (
              <label key={q.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQuestion(q.id)}
                  className="mt-0.5 w-4 h-4 text-indigo-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeBadge[q.type]}>{q.type}</Badge>
                    <span className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{q.text}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setPickerOpen(false)}>Done ({form.questionIds.length} selected)</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
