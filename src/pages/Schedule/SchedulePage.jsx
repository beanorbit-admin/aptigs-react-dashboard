import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Table from '../../components/common/Table'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setEvents, addEvent, updateEvent, deleteEvent } from '../../store/slices/scheduleSlice'
import { events as mockEvents } from '../../mock/schedule'

const typeColor = { Class: '#4F46E5', Exam: '#DC2626', Activity: '#059669' }
const typeBadge = { Class: 'info', Exam: 'danger', Activity: 'success' }

const emptyForm = { title: '', type: 'Class', courseId: '', teacherId: '', date: '', startTime: '', endTime: '', notes: '' }

export default function SchedulePage() {
  const dispatch = useAppDispatch()
  const events = useAppSelector(state => state.schedule.list)
  const courses = useAppSelector(state => state.courses.list)
  const teachers = useAppSelector(state => state.teachers.list)

  const [view, setView] = useState('calendar')
  const [typeFilter, setTypeFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (events.length === 0) dispatch(setEvents(mockEvents))
  }, [dispatch, events.length])

  const calEvents = events.map(e => ({
    id: String(e.id),
    title: e.title,
    date: e.date,
    backgroundColor: typeColor[e.type] || '#4F46E5',
    borderColor: typeColor[e.type] || '#4F46E5',
    extendedProps: e,
  }))

  const filteredList = typeFilter === 'All' ? events : events.filter(e => e.type === typeFilter)

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (e) => {
    setEditTarget(e)
    setForm({ title: e.title, type: e.type, courseId: e.courseId || '', teacherId: e.teacherId || '', date: e.date, startTime: e.startTime, endTime: e.endTime, notes: e.notes || '' })
    setDetailTarget(null)
    setModalOpen(true)
  }

  const onSave = () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return }
    const course = courses.find(c => c.id === Number(form.courseId))
    const teacher = teachers.find(t => t.id === Number(form.teacherId))
    const payload = { ...form, courseId: Number(form.courseId), teacherId: Number(form.teacherId), courseName: course?.title || '', teacherName: teacher?.name || '' }
    if (editTarget) {
      dispatch(updateEvent({ ...editTarget, ...payload }))
      toast.success('Event updated')
    } else {
      dispatch(addEvent({ ...payload, id: Date.now() }))
      toast.success('Event added')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    dispatch(deleteEvent(deleteTarget.id))
    toast.success('Event deleted')
    setDeleteTarget(null)
  }

  return (
    <PageWrapper title="Schedule">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['calendar', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${view === v ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {v === 'calendar' ? 'Calendar View' : 'List View'}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}>+ Add Event</Button>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={calEvents}
            eventClick={({ event }) => setDetailTarget(event.extendedProps)}
            height="auto"
          />
        </div>
      ) : (
        <>
          <div className="mb-3">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['All', 'Class', 'Exam', 'Activity'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Table
            columns={[
              { header: 'Title', cell: e => <span className="font-medium text-gray-900">{e.title}</span> },
              { header: 'Type', cell: e => <Badge variant={typeBadge[e.type]}>{e.type}</Badge> },
              { header: 'Course', cell: e => e.courseName || '—' },
              { header: 'Teacher', cell: e => e.teacherName || '—' },
              { header: 'Date', accessor: 'date' },
              { header: 'Start', accessor: 'startTime' },
              { header: 'End', accessor: 'endTime' },
              {
                header: 'Actions',
                cell: e => (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ),
              },
            ]}
            data={filteredList}
          />
        </>
      )}

      {/* Event Detail Modal */}
      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title="Event Details" size="sm">
        {detailTarget && (
          <div className="space-y-3">
            <div><Badge variant={typeBadge[detailTarget.type]}>{detailTarget.type}</Badge></div>
            <p className="text-lg font-semibold text-gray-900">{detailTarget.title}</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Date:</span> {detailTarget.date}</p>
              <p><span className="font-medium">Time:</span> {detailTarget.startTime} – {detailTarget.endTime}</p>
              {detailTarget.courseName && <p><span className="font-medium">Course:</span> {detailTarget.courseName}</p>}
              {detailTarget.teacherName && <p><span className="font-medium">Teacher:</span> {detailTarget.teacherName}</p>}
              {detailTarget.notes && <p><span className="font-medium">Notes:</span> {detailTarget.notes}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(detailTarget)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => { setDeleteTarget(detailTarget); setDetailTarget(null) }}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Event' : 'Add Event'}>
        <div className="space-y-4">
          {[
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'startTime', label: 'Start Time', type: 'time' },
            { key: 'endTime', label: 'End Time', type: 'time' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['Class', 'Exam', 'Activity'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Linked Course</label>
            <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Linked Teacher</label>
            <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">None</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={onSave}>{editTarget ? 'Update' : 'Add Event'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete event <strong>{deleteTarget?.title}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
