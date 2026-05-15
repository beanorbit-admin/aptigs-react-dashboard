import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchQuizzesThunk, createQuizThunk, updateQuizThunk } from '../../store/slices/quizSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'

export default function QuizForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEdit = Boolean(id)

  const quizzes = useAppSelector(state => state.quizzes.list)
  const courses = useAppSelector(state => state.courses.list)

  const existing = isEdit ? quizzes.find(q => q.id === Number(id)) : null

  const [form, setForm] = useState({
    title: '', courseId: '', description: '', timerEnabled: false,
    timerMinutes: 30, passScore: 60, attempts: 2,
  })

  useEffect(() => {
    dispatch(fetchCoursesThunk())
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
      })
    }
  }, [existing])

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
      toast.success(isEdit ? 'Quiz updated' : 'Quiz created')
      navigate(`/quizzes/${quizId}/questions`)
    } else {
      toast.error('Save failed')
    }
  }

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

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => handleSave('Draft')}>Save as Draft</Button>
          <Button onClick={() => handleSave('Published')}>Publish</Button>
          <Button variant="ghost" onClick={() => navigate('/quizzes')}>Cancel</Button>
        </div>
      </div>
    </PageWrapper>
  )
}
