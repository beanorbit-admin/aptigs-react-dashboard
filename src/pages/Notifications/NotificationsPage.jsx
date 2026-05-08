import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  CreditCard, HelpCircle, BookOpen, CheckCheck,
  Bell, Trash2, Send, Clock, ImageIcon, X, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  setNotifications, markAsRead, markAllAsRead,
  sendNotification, addScheduled, deleteScheduled,
} from '../../store/slices/notificationSlice'
import { setStudents } from '../../store/slices/studentSlice'
import { setCourses } from '../../store/slices/courseSlice'
import { notifications as mockNotifications } from '../../mock/notifications'
import { students as mockStudents } from '../../mock/students'
import { courses as mockCourses } from '../../mock/courses'
import { formatDistanceToNow, formatDate } from '../../utils/formatters'

const PAGE_SIZE = 10

const typeIcon = {
  payment:      { icon: CreditCard,  color: 'text-emerald-600 bg-emerald-50' },
  quiz:         { icon: HelpCircle,  color: 'text-blue-600 bg-blue-50' },
  lesson:       { icon: BookOpen,    color: 'text-amber-600 bg-amber-50' },
  announcement: { icon: Bell,        color: 'text-indigo-600 bg-indigo-50' },
}

const INIT_FORM = {
  title: '', message: '', image: null,
  recipientType: 'all-students',
  courseId: '', studentIds: [],
  scheduleDate: '', scheduleTime: '',
}

function formatScheduleDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatScheduleTime(timeStr) {
  if (!timeStr) return '—'
  const [h, min] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`
}

function formatSentTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ─── Create / Schedule Notification Modal ───────────────────────────────────
function CreateNotificationModal({ isOpen, onClose, courses, students }) {
  const dispatch = useAppDispatch()
  const [form, setForm] = useState(INIT_FORM)
  const [studentSearch, setStudentSearch] = useState('')
  const imageInputRef = useRef(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const reset = () => { setForm(INIT_FORM); setStudentSearch('') }

  const handleClose = () => { reset(); onClose() }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => set('image', evt.target.result)
    reader.readAsDataURL(file)
  }

  const recipientLabel = () => {
    switch (form.recipientType) {
      case 'all-students': return 'All Students'
      case 'course-students': {
        const c = courses.find(c => c.id === Number(form.courseId))
        return c ? `Students in ${c.title}` : 'Course Students'
      }
      case 'selected-students':
        return `${form.studentIds.length} Selected Student${form.studentIds.length !== 1 ? 's' : ''}`
      case 'all-teachers': return 'All Teachers'
      default: return ''
    }
  }

  const validate = (requireSchedule) => {
    if (!form.title.trim()) { toast.error('Title is required'); return false }
    if (!form.message.trim()) { toast.error('Message is required'); return false }
    if (form.recipientType === 'course-students' && !form.courseId) {
      toast.error('Please select a course'); return false
    }
    if (form.recipientType === 'selected-students' && form.studentIds.length === 0) {
      toast.error('Please select at least one student'); return false
    }
    if (requireSchedule) {
      if (!form.scheduleDate) { toast.error('Please set a schedule date'); return false }
      if (!form.scheduleTime) { toast.error('Please set a schedule time'); return false }
    }
    return true
  }

  const handleSendNow = () => {
    if (!validate(false)) return
    dispatch(sendNotification({
      id: Date.now(),
      title: form.title,
      message: form.message,
      image: form.image,
      recipientType: form.recipientType,
      courseId: form.courseId ? Number(form.courseId) : null,
      studentIds: form.studentIds,
      recipientLabel: recipientLabel(),
      sentAt: new Date().toISOString(),
      type: 'announcement',
    }))
    toast.success('Notification sent successfully')
    reset(); onClose()
  }

  const handleSchedule = () => {
    if (!validate(true)) return
    dispatch(addScheduled({
      id: Date.now(),
      title: form.title,
      message: form.message,
      image: form.image,
      recipientType: form.recipientType,
      courseId: form.courseId ? Number(form.courseId) : null,
      studentIds: form.studentIds,
      recipientLabel: recipientLabel(),
      scheduleDate: form.scheduleDate,
      scheduleTime: form.scheduleTime,
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    }))
    toast.success('Notification scheduled')
    reset(); onClose()
  }

  const toggleStudent = (id) => {
    set('studentIds', form.studentIds.includes(id)
      ? form.studentIds.filter(x => x !== id)
      : [...form.studentIds, id])
  }

  const filteredStudents = useMemo(() => {
    const s = studentSearch.toLowerCase()
    return students.filter(st => !s || st.name.toLowerCase().includes(s))
  }, [students, studentSearch])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Notification" size="lg">
      <div className="space-y-5">

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Notification title"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Message *</label>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            rows={4}
            placeholder="Enter notification message..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Image */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Image (optional)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <ImageIcon className="h-4 w-4" />
              {form.image ? 'Change Image' : 'Upload Image'}
            </button>
            {form.image && (
              <>
                <img src={form.image} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                <button type="button" onClick={() => set('image', null)} className="text-gray-400 hover:text-red-500 transition">
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Recipients */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Send To *</label>
          <div className="space-y-2">
            {[
              { value: 'all-students',      label: 'All Students' },
              { value: 'course-students',   label: 'Students in a specific course' },
              { value: 'selected-students', label: 'Selected students' },
              { value: 'all-teachers',      label: 'All Teachers' },
            ].map(r => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  value={r.value}
                  checked={form.recipientType === r.value}
                  onChange={() => set('recipientType', r.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700">{r.label}</span>
              </label>
            ))}
          </div>

          {/* Course selector */}
          {form.recipientType === 'course-students' && (
            <div className="mt-3">
              <select
                value={form.courseId}
                onChange={e => set('courseId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          )}

          {/* Student multi-select */}
          {form.recipientType === 'selected-students' && (
            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search students..."
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                {filteredStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.studentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="w-4 h-4 text-indigo-600 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              {form.studentIds.length > 0 && (
                <div className="px-3 py-2 bg-indigo-50 text-xs text-indigo-700 border-t border-indigo-100">
                  {form.studentIds.length} student{form.studentIds.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule section */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Schedule</p>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to send immediately, or set a date and time to schedule.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
            <input
              type="date"
              value={form.scheduleDate}
              onChange={e => set('scheduleDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Time</label>
            <input
              type="time"
              value={form.scheduleTime}
              onChange={e => set('scheduleTime', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-1">
          <Button onClick={handleSendNow}>
            <Send className="h-4 w-4" />
            Send Now
          </Button>
          <Button variant="secondary" onClick={handleSchedule}>
            <Clock className="h-4 w-4" />
            Schedule
          </Button>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.auth)
  const notifications  = useAppSelector(state => state.notifications.list)
  const sent           = useAppSelector(state => state.notifications.sent)
  const scheduled      = useAppSelector(state => state.notifications.scheduled)
  const courses        = useAppSelector(state => state.courses.list)
  const students       = useAppSelector(state => state.students.list)

  const [tab, setTab] = useState('inbox')
  const [expandedId, setExpandedId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [sentQuery, setSentQuery] = useState({ search: '', filters: {}, page: 1 })
  const [scheduledQuery, setScheduledQuery] = useState({ search: '', filters: {}, page: 1 })

  useEffect(() => {
    if (notifications.length === 0) dispatch(setNotifications(mockNotifications))
    if (students.length === 0)      dispatch(setStudents(mockStudents))
    if (courses.length === 0)       dispatch(setCourses(mockCourses))
  }, [dispatch, notifications.length, students.length, courses.length])

  // ── Sent table data ────────────────────────────────────────────────────────
  const { rows: sentRows, total: sentTotal } = useMemo(() => {
    const s = (sentQuery.search || '').toLowerCase()
    const filtered = sent.filter(n => !s || n.title.toLowerCase().includes(s) || n.recipientLabel?.toLowerCase().includes(s))
    return {
      rows: filtered.slice((sentQuery.page - 1) * PAGE_SIZE, sentQuery.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [sent, sentQuery])

  // ── Scheduled table data ───────────────────────────────────────────────────
  const { rows: schedRows, total: schedTotal } = useMemo(() => {
    const s = (scheduledQuery.search || '').toLowerCase()
    const filtered = scheduled.filter(n => !s || n.title.toLowerCase().includes(s) || n.recipientLabel?.toLowerCase().includes(s))
    return {
      rows: filtered.slice((scheduledQuery.page - 1) * PAGE_SIZE, scheduledQuery.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [scheduled, scheduledQuery])

  const handleSentQuery      = useCallback(q => setSentQuery(q), [])
  const handleScheduledQuery = useCallback(q => setScheduledQuery(q), [])

  const unreadCount = notifications.filter(n => !n.read).length

  // ── Column defs ────────────────────────────────────────────────────────────
  const sentColumns = [
    {
      header: 'Title',
      cell: n => <span className="font-medium text-gray-900">{n.title}</span>,
    },
    {
      header: 'Message',
      cell: n => (
        <span className="text-sm text-gray-600">
          {n.message.length > 60 ? n.message.slice(0, 60) + '…' : n.message}
        </span>
      ),
    },
    {
      header: 'Recipients',
      cell: n => <span className="text-sm text-gray-700">{n.recipientLabel}</span>,
    },
    {
      header: 'Date Sent',
      cell: n => <span className="text-sm text-gray-700">{formatDate(n.sentAt)}</span>,
    },
    {
      header: 'Time Sent',
      cell: n => <span className="text-sm text-gray-700">{formatSentTime(n.sentAt)}</span>,
    },
    {
      header: 'Image',
      cell: n => n.image
        ? <img src={n.image} alt="" className="h-8 w-8 rounded object-cover border border-gray-200" />
        : <span className="text-gray-400 text-xs">—</span>,
    },
  ]

  const scheduledColumns = [
    {
      header: 'Title',
      cell: n => <span className="font-medium text-gray-900">{n.title}</span>,
    },
    {
      header: 'Message',
      cell: n => (
        <span className="text-sm text-gray-600">
          {n.message.length > 50 ? n.message.slice(0, 50) + '…' : n.message}
        </span>
      ),
    },
    {
      header: 'Recipients',
      cell: n => <span className="text-sm text-gray-700">{n.recipientLabel}</span>,
    },
    {
      header: 'Date',
      cell: n => <span className="text-sm text-gray-700">{formatScheduleDate(n.scheduleDate)}</span>,
    },
    {
      header: 'Time',
      cell: n => <span className="text-sm text-gray-700">{formatScheduleTime(n.scheduleTime)}</span>,
    },
    {
      header: 'Status',
      cell: n => <Badge variant="warning">{n.status}</Badge>,
    },
    {
      header: 'Actions',
      cell: n => (
        <button
          onClick={() => { dispatch(deleteScheduled(n.id)); toast.success('Scheduled notification removed') }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'inbox',     label: 'Inbox',     badge: unreadCount > 0 ? unreadCount : null },
    { key: 'sent',      label: 'Sent',      badge: null },
    { key: 'scheduled', label: 'Scheduled', badge: scheduled.length > 0 ? scheduled.length : null },
  ]

  return (
    <PageWrapper title="Notifications">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {t.label}
              {t.badge !== null && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${t.key === 'inbox' ? 'bg-red-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {tab === 'inbox' && unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => { dispatch(markAllAsRead()); toast.success('All marked as read') }}>
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          {(role === 'admin') && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + Create Notification
            </Button>
          )}
        </div>
      </div>

      {/* ── Inbox tab ─────────────────────────────────────────────────────── */}
      {tab === 'inbox' && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {notifications.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No notifications</p>
          )}
          {notifications.map(n => {
            const { icon: Icon, color } = typeIcon[n.type] || typeIcon.lesson
            return (
              <div key={n.id} className={!n.read ? 'border-l-4 border-indigo-500' : ''}>
                <button
                  onClick={() => { dispatch(markAsRead(n.id)); setExpandedId(prev => prev === n.id ? null : n.id) }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex items-start gap-4"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(n.createdAt || n.sentAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
                </button>
                {expandedId === n.id && (
                  <div className="px-6 pb-4 pl-[4.25rem]">
                    {n.image && (
                      <img src={n.image} alt="" className="mb-3 max-h-48 rounded-xl object-cover border border-gray-200" />
                    )}
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3">{n.message}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Sent tab ──────────────────────────────────────────────────────── */}
      {tab === 'sent' && (
        <DataTable
          columns={sentColumns}
          data={sentRows}
          total={sentTotal}
          searchPlaceholder="Search by title or recipients..."
          filterConfigs={[]}
          pageSize={PAGE_SIZE}
          onQueryChange={handleSentQuery}
        />
      )}

      {/* ── Scheduled tab ─────────────────────────────────────────────────── */}
      {tab === 'scheduled' && (
        <DataTable
          columns={scheduledColumns}
          data={schedRows}
          total={schedTotal}
          searchPlaceholder="Search by title or recipients..."
          filterConfigs={[]}
          pageSize={PAGE_SIZE}
          onQueryChange={handleScheduledQuery}
        />
      )}

      {/* Create Notification Modal */}
      <CreateNotificationModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        courses={courses}
        students={students}
      />
    </PageWrapper>
  )
}
