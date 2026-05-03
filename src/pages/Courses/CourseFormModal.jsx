import { useEffect, useState } from 'react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { useAppSelector } from '../../hooks/redux'

export default function CourseFormModal({ isOpen, onClose, onSave, editTarget, categories }) {
  const teachers = useAppSelector(state => state.teachers.list)
  const [form, setForm] = useState({
    title: '', categoryId: '', description: '', duration: '',
    fee: '', status: 'Active', teacherIds: []
  })

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title || '',
        categoryId: editTarget.categoryId || '',
        description: editTarget.description || '',
        duration: editTarget.duration || '',
        fee: editTarget.fee || '',
        status: editTarget.status || 'Active',
        teacherIds: editTarget.teacherIds || [],
      })
    } else {
      setForm({ title: '', categoryId: '', description: '', duration: '', fee: '', status: 'Active', teacherIds: [] })
    }
  }, [editTarget, isOpen])

  const toggleTeacher = (tid) => {
    setForm(f => ({
      ...f,
      teacherIds: f.teacherIds.includes(tid)
        ? f.teacherIds.filter(id => id !== tid)
        : [...f.teacherIds, tid]
    }))
  }

  const handleSave = () => {
    if (!form.title || !form.categoryId) return
    onSave({ ...form, fee: Number(form.fee), categoryId: Number(form.categoryId) })
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 Years"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Fee (₹)</label>
            <input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
          <div className="flex flex-wrap gap-2">
            {teachers.map(t => (
              <button key={t.id} type="button" onClick={() => toggleTeacher(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${form.teacherIds.includes(t.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{editTarget ? 'Update Course' : 'Add Course'}</Button>
        </div>
      </div>
    </Modal>
  )
}
