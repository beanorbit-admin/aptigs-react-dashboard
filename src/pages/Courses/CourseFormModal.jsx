import { useEffect, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import SearchableMultiSelect from '../../components/common/SearchableMultiSelect'
import { useApiQuery } from '../../hooks/useApiQuery'
import { fetchTeacherOptions } from '../../services/teacherService'
import { useCardThemes, themeGradient } from '../../hooks/useCardThemes'
import CourseCardPreview from '../../components/courses/CourseCardPreview'

const EMPTY_FORM = {
  title: '', categoryId: '', description: '', duration: '', durationHours: '',
  fee: '', status: 'Active', teacherIds: [], cardTheme: 'blue',
}

export default function CourseFormModal({ isOpen, onClose, onSave, editTarget, categories }) {
  // Unpaginated, refreshed on each open so newly added teachers show up.
  const { data: teacherOptions, loading: teachersLoading } = useApiQuery(
    (signal) => (isOpen ? fetchTeacherOptions(signal) : Promise.resolve(null)),
    [isOpen]
  )
  const teachers = teacherOptions ?? []
  const [form, setForm] = useState(EMPTY_FORM)
  const cardThemes = useCardThemes()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageRemoved, setImageRemoved] = useState(false)

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title || '',
        categoryId: editTarget.category || '',
        description: editTarget.description || '',
        duration: editTarget.duration || '',
        durationHours: editTarget.duration_hours ?? '',
        fee: editTarget.fee || '',
        status: editTarget.status || 'Active',
        teacherIds: editTarget.teacher_ids || [],
        cardTheme: editTarget.card_theme || 'blue',
      })
      setImagePreview(editTarget.image || null)
    } else {
      setForm(EMPTY_FORM)
      setImagePreview(null)
    }
    setImageFile(null)
    setImageRemoved(false)
  }, [editTarget, isOpen])

  const selectedTheme = cardThemes.find(t => t.key === form.cardTheme)
  const firstTutor = teachers
    .filter(t => form.teacherIds.includes(t.id) && t.status === 'Active')
    .sort((a, b) => a.id - b.id)[0]

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageRemoved(false)
  }

  const removeImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setImageRemoved(true)
  }

  const handleSave = () => {
    if (!form.title || !form.categoryId) return
    const payload = {
      title: form.title,
      description: form.description,
      duration: form.duration,
      duration_hours: form.durationHours === '' ? null : Number(form.durationHours),
      status: form.status,
      fee: Number(form.fee),
      category: Number(form.categoryId),
      card_theme: form.cardTheme,
      teacher_ids: form.teacherIds,
    }
    if (imageRemoved && !imageFile) payload.image = null
    onSave(payload, imageFile)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTarget ? 'Edit Course' : 'Add Course'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Course Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category *</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 Years"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Total Hours</label>
            <input type="number" min="0" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} placeholder="e.g. 15"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Fee (₹)</label>
            <input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Card Image &amp; Colour</label>
          <div className="flex gap-4 items-start">
            <CourseCardPreview
              className="w-72 shrink-0"
              title={form.title}
              description={form.description}
              image={imagePreview}
              theme={selectedTheme}
              tutor={firstTutor}
              durationHours={form.durationHours === '' ? null : form.durationHours}
              lessonCount={editTarget?.lesson_count}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <ImagePlus className="h-4 w-4" />
                  {imagePreview ? 'Change image' : 'Upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
                </label>
                {imagePreview && (
                  <button type="button" onClick={removeImage} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {cardThemes.map(t => (
                  <button key={t.key} type="button" title={t.label}
                    onClick={() => setForm(f => ({ ...f, cardTheme: t.key }))}
                    className={`h-7 w-7 rounded-full transition ${form.cardTheme === t.key ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
                    style={{ background: themeGradient(t) }} />
                ))}
              </div>
              <p className="text-xs text-gray-500">Pick a colour that matches the image. This is how the card appears in the student app.</p>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
          <div className="flex gap-4">
            {['Active', 'Inactive'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s }))} />
                <span className="text-sm text-gray-700">{s}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Assigned Teachers</label>
          <SearchableMultiSelect
            options={teachers.map(t => ({
              id: t.id,
              label: t.name,
              sublabel: [t.designation, t.status === 'Inactive' && 'Inactive'].filter(Boolean).join(' · '),
              avatar: t.photo,
              showAvatar: true,
            }))}
            value={form.teacherIds}
            onChange={teacherIds => setForm(f => ({ ...f, teacherIds }))}
            loading={teachersLoading}
            searchPlaceholder="Search teachers..."
            emptyText="No teachers available"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{editTarget ? 'Update Course' : 'Add Course'}</Button>
        </div>
      </div>
    </Modal>
  )
}
