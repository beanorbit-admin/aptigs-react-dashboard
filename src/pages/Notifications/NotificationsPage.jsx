import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  CreditCard, HelpCircle, BookOpen, CheckCheck,
  Bell, Trash2, Send, Clock, ImageIcon, X, Search, Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchNotificationsThunk, markAsReadThunk, markAllAsReadThunk,
  createScheduledThunk, deleteScheduledThunk,
  fetchSystemStatusThunk, sendNotificationNowThunk,
  updateSentThunk, deleteSentThunk,
} from '../../store/slices/notificationSlice'
import { fetchStudentsThunk } from '../../store/slices/studentSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'
import { formatDistanceToNow, formatDate } from '../../utils/formatters'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'

const PAGE_SIZE = 10

const typeIcon = {
  payment:      { icon: CreditCard,  color: 'text-emerald-600 bg-emerald-50' },
  quiz:         { icon: HelpCircle,  color: 'text-blue-600 bg-blue-50' },
  lesson:       { icon: BookOpen,    color: 'text-amber-600 bg-amber-50' },
  announcement: { icon: Bell,        color: 'text-indigo-600 bg-indigo-50' },
}

const INIT_FORM = {
  title: '', message: '', type: 'general', image: null,
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

function targetLabel(n) {
  if (n.recipients_preview) return n.recipients_preview
  if (n.target === 'all_students') return 'All Students'
  if (n.target === 'all_teachers') return 'All Teachers'
  if (n.target === 'course_students') return 'Course Students'
  if (n.target === 'selected_students') return 'Selected Students'
  return n.target || '—'
}

// ─── Create / Schedule Notification Modal ───────────────────────────────────
function CreateNotificationModal({ isOpen, onClose, onCreated, courses, students, systemStatus, sendLoading }) {
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

  const handleSendNow = async () => {
    if (!validate(false)) return
    const recipientTypeMap = {
      'all-students': 'all_students',
      'course-students': 'course_students',
      'selected-students': 'selected_students',
      'all-teachers': 'all_teachers',
    }
    const result = await dispatch(sendNotificationNowThunk({
      title: form.title,
      message: form.message,
      type: form.type,
      recipient_type: recipientTypeMap[form.recipientType],
      course_id: form.courseId ? Number(form.courseId) : null,
      student_ids: form.studentIds,
    }))
    if (result.meta.requestStatus === 'fulfilled') {
      const { warning, recipient_count } = result.payload
      if (warning) {
        toast(warning, { icon: '⚠️', duration: 6000 })
      } else {
        toast.success(`Sent to ${recipient_count} recipient${recipient_count !== 1 ? 's' : ''}`)
      }
      reset()
      onCreated('sent')
    } else {
      toast.error(result.payload?.error || 'Failed to send notification')
    }
  }

  const handleSchedule = async () => {
    if (!validate(true)) return
    const recipientTypeMap = {
      'all-students': 'all_students',
      'course-students': 'course_students',
      'selected-students': 'selected_students',
      'all-teachers': 'all_teachers',
    }
    const result = await dispatch(createScheduledThunk({
      title: form.title,
      message: form.message,
      type: form.type,
      target: recipientTypeMap[form.recipientType] ?? 'all_students',
      course: form.courseId ? Number(form.courseId) : null,
      selected_recipients: form.studentIds,
      scheduled_at: `${form.scheduleDate}T${form.scheduleTime}:00`,
    }))
    if (result.meta.requestStatus === 'fulfilled') {
      const { warning } = result.payload
      if (warning) {
        toast(warning, { icon: '⚠️', duration: 6000 })
      } else {
        toast.success('Notification scheduled')
      }
      reset()
      onCreated('scheduled')
    } else {
      toast.error('Failed to schedule notification')
    }
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

        {/* Provider unavailable warning */}
        {systemStatus && !systemStatus.provider.available && (
          <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            Provider &quot;{systemStatus.provider.name}&quot; is not configured — notifications may not be delivered.
          </div>
        )}

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

        {/* Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TYPE_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
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
          <Button onClick={handleSendNow} disabled={sendLoading}>
            <Send className="h-4 w-4" />
            {sendLoading ? 'Sending…' : 'Send Now'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSchedule}
            disabled={systemStatus != null && !systemStatus.celery.available}
            title={systemStatus && !systemStatus.celery.available ? 'Celery workers are unavailable' : undefined}
          >
            <Clock className="h-4 w-4" />
            Schedule
          </Button>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Edit Sent Notification Modal ────────────────────────────────────────────
const TYPE_CHOICES = [
  { value: 'general', label: 'General' },
  { value: 'payment', label: 'Payment' },
  { value: 'quiz',    label: 'Quiz' },
  { value: 'lesson',  label: 'Lesson' },
]

function EditNotificationModal({ notification, onClose }) {
  const dispatch = useAppDispatch()
  const [form, setForm] = useState({
    title:   notification.title   ?? '',
    message: notification.message ?? '',
    type:    notification.type    ?? 'general',
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.message.trim()) { toast.error('Message is required'); return }
    setSaving(true)
    const result = await dispatch(updateSentThunk({ id: notification.id, data: form }))
    setSaving(false)
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Notification updated')
      onClose()
    } else {
      toast.error(result.payload?.detail || 'Failed to update notification')
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Edit Notification" size="lg">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Message *</label>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TYPE_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
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
  const systemStatus   = useAppSelector(state => state.notifications.systemStatus)
  const sendLoading    = useAppSelector(state => state.notifications.sendLoading)
  const courses        = useAppSelector(state => state.courses.list)
  const students       = useAppSelector(state => state.students.list)

  const [tab, setTab] = useState('inbox')
  const [expandedId, setExpandedId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  const [sentQuery, setSentQuery] = useState({ search: '', filters: {}, page: 1 })
  const [scheduledQuery, setScheduledQuery] = useState({ search: '', filters: {}, page: 1 })

  useEffect(() => {
    dispatch(fetchNotificationsThunk())
    dispatch(fetchStudentsThunk())
    dispatch(fetchCoursesThunk())
    dispatch(fetchSystemStatusThunk())
  }, [dispatch])

  // ── Sent table data ────────────────────────────────────────────────────────
  const { data: sentData, loading: sentLoading, refetch: refetchSent } = useApiQuery(
    (signal) => api.get('notifications/admin/', {
      params: { is_sent: true, search: sentQuery.search || undefined, page: sentQuery.page },
      signal,
    }).then(r => r.data),
    [sentQuery.search, sentQuery.page]
  )

  const sentRows  = sentData?.results ?? []
  const sentTotal = sentData?.count ?? 0

  // ── Scheduled table data ───────────────────────────────────────────────────
  const { data: schedData, loading: schedLoading, refetch: refetchSched } = useApiQuery(
    (signal) => api.get('notifications/admin/', {
      params: { is_sent: false, search: scheduledQuery.search || undefined, page: scheduledQuery.page },
      signal,
    }).then(r => r.data),
    [scheduledQuery.search, scheduledQuery.page]
  )

  const schedRows  = schedData?.results ?? []
  const schedTotal = schedData?.count ?? 0

  const handleSentQuery      = useCallback(q => setSentQuery(q), [])
  const handleScheduledQuery = useCallback(q => setScheduledQuery(q), [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── Column defs ────────────────────────────────────────────────────────────
  const sentColumns = [
    {
      header: 'Title',
      cell: n => <span className="font-medium text-gray-900">{n.title || '—'}</span>,
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
      cell: n => <span className="text-sm text-gray-700">{targetLabel(n)}</span>,
    },
    {
      header: 'Date Sent',
      cell: n => <span className="text-sm text-gray-700">{formatDate(n.sent_at)}</span>,
    },
    {
      header: 'Time Sent',
      cell: n => <span className="text-sm text-gray-700">{formatSentTime(n.sent_at)}</span>,
    },
    {
      header: 'Actions',
      cell: n => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingNotification(n)}
            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              const r = await dispatch(deleteSentThunk(n.id))
              if (r.meta.requestStatus === 'fulfilled') { toast.success('Notification deleted'); refetchSent() }
              else toast.error('Delete failed')
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const scheduledColumns = [
    {
      header: 'Title',
      cell: n => <span className="font-medium text-gray-900">{n.title || '—'}</span>,
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
      cell: n => <span className="text-sm text-gray-700">{targetLabel(n)}</span>,
    },
    {
      header: 'Date',
      cell: n => <span className="text-sm text-gray-700">{formatDate(n.scheduled_at)}</span>,
    },
    {
      header: 'Time',
      cell: n => <span className="text-sm text-gray-700">{formatSentTime(n.scheduled_at)}</span>,
    },
    {
      header: 'Status',
      cell: n => <Badge variant="warning">Pending</Badge>,
    },
    {
      header: 'Actions',
      cell: n => (
        <button
          onClick={async () => { const r = await dispatch(deleteScheduledThunk(n.id)); if (r.meta.requestStatus === 'fulfilled') { toast.success('Scheduled notification removed'); refetchSched() } else toast.error('Delete failed') }}
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
    { key: 'scheduled', label: 'Scheduled', badge: schedTotal > 0 ? schedTotal : null },
  ]

  return (
    <PageWrapper title="Notifications">
      {/* Celery unavailable banner */}
      {systemStatus && !systemStatus.celery.available && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Celery workers are unavailable — scheduled notifications will not be sent automatically.
        </div>
      )}

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
            <Button variant="secondary" size="sm" onClick={async () => { await dispatch(markAllAsReadThunk()); toast.success('All marked as read') }}>
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
              <div key={n.id} className={!n.is_read ? 'border-l-4 border-indigo-500' : ''}>
                <button
                  onClick={() => { dispatch(markAsReadThunk(n.id)); setExpandedId(prev => prev === n.id ? null : n.id) }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex items-start gap-4"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(n.created_at || n.sentAt)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
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
          loading={sentLoading}
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
          loading={schedLoading}
          searchPlaceholder="Search by title or recipients..."
          filterConfigs={[]}
          pageSize={PAGE_SIZE}
          onQueryChange={handleScheduledQuery}
        />
      )}

      {/* Edit Notification Modal */}
      {editingNotification && (
        <EditNotificationModal
          notification={editingNotification}
          onClose={() => { setEditingNotification(null); refetchSent() }}
        />
      )}

      {/* Create Notification Modal */}
      <CreateNotificationModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(tabType) => { setTab(tabType); setCreateOpen(false); if (tabType === 'sent') refetchSent(); else refetchSched() }}
        courses={courses}
        students={students}
        systemStatus={systemStatus}
        sendLoading={sendLoading}
      />
    </PageWrapper>
  )
}
