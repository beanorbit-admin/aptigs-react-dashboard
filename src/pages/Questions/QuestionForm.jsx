import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchQuestionsThunk, createQuestionThunk, updateQuestionThunk } from '../../store/slices/questionSlice'

export default function QuestionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isEdit = Boolean(id)

  const questions = useAppSelector(state => state.questions.list)
  const existing = isEdit ? questions.find(q => q.id === Number(id)) : null

  const [type, setType] = useState('MCQ')
  const [text, setText] = useState('')
  const [marks, setMarks] = useState(1)
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState(0)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(true)

  useEffect(() => { if (isEdit) dispatch(fetchQuestionsThunk()) }, [isEdit, dispatch])

  useEffect(() => {
    if (existing) {
      setType(existing.type)
      setText(existing.text)
      setMarks(existing.marks)
      if (existing.type === 'MCQ') {
        setOptions(existing.options || ['', '', '', ''])
        setCorrectOption(existing.correct_option ?? 0)
      } else if (existing.type === 'FillBlank') {
        setCorrectAnswer(existing.correct_answer || '')
        setHint(existing.hint || '')
      } else {
        setTrueFalseAnswer(existing.correct_answer)
      }
    }
  }, [existing])

  const handleSave = async () => {
    if (!text.trim()) { toast.error('Question text is required'); return }
    const base = { type, text, marks: Number(marks) }
    let payload
    if (type === 'MCQ') payload = { ...base, options, correct_option: correctOption }
    else if (type === 'FillBlank') payload = { ...base, correct_answer: correctAnswer, hint }
    else payload = { ...base, correct_answer: trueFalseAnswer }

    const result = isEdit
      ? await dispatch(updateQuestionThunk({ id: existing.id, data: payload }))
      : await dispatch(createQuestionThunk(payload))

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(isEdit ? 'Question updated' : 'Question added')
      navigate('/questions')
    } else {
      toast.error('Save failed')
    }
  }

  return (
    <PageWrapper title={isEdit ? 'Edit Question' : 'Add Question'}>
      <div className="max-w-xl space-y-6">
        {/* Type selector */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="text-sm font-semibold text-gray-700 block mb-3">Question Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'MCQ', label: 'MCQ' },
              { value: 'FillBlank', label: 'Fill in the Blank' },
              { value: 'TrueFalse', label: 'True / False' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${type === t.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {/* Question text */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Question Text *</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder="Enter your question here..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Marks */}
          <div className="w-28">
            <label className="text-sm font-medium text-gray-700 block mb-1">Marks</label>
            <input type="number" min="1" value={marks} onChange={e => setMarks(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* MCQ options */}
          {type === 'MCQ' && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={correctOption === i}
                    onChange={() => setCorrectOption(i)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <input
                    value={opt}
                    onChange={e => setOptions(opts => opts.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500">Select the radio button next to the correct answer</p>
            </div>
          )}

          {/* Fill in the Blank */}
          {type === 'FillBlank' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Correct Answer</label>
                <input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Hint (optional)</label>
                <input value={hint} onChange={e => setHint(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          )}

          {/* True / False */}
          {type === 'TrueFalse' && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-3">Correct Answer</label>
              <div className="grid grid-cols-2 gap-4">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setTrueFalseAnswer(val)}
                    className={`py-4 rounded-xl border-2 text-sm font-semibold transition ${trueFalseAnswer === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {val ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave}>{isEdit ? 'Update Question' : 'Save Question'}</Button>
          <Button variant="secondary" onClick={() => navigate('/questions')}>Cancel</Button>
        </div>
      </div>
    </PageWrapper>
  )
}
