import { useState } from 'react'
import { CreditCard, HelpCircle, BookOpen, CheckCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { markAsRead, markAllAsRead, addScheduled, deleteScheduled } from '../../store/slices/notificationSlice'
import { formatDistanceToNow, formatDate } from '../../utils/formatters'

const typeIcon = {
  payment: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
  quiz: { icon: HelpCircle, color: 'text-blue-600 bg-blue-50' },
  lesson: { icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { role } = useAppSelector(state => state.auth)
  const notifications = useAppSelector(state => state.notifications.list)
  const scheduled = useAppSelector(state => state.notifications.scheduled)

  const [tab, setTab] = useState('inbox')
  const [expandedId, setExpandedId] = useState(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [schedForm, setSchedForm] = useState({ recipients: 'All Students', message: '', sendAt: '' })

  const handleClick = (n) => {
    dispatch(markAsRead(n.id))
    setExpandedId(prev => prev === n.id ? null : n.id)
  }

  const handleMarkAll = () => {
    dispatch(markAllAsRead())
    toast.success('All marked as read')
  }

  const handleSchedule = () => {
    if (!schedForm.message || !schedForm.sendAt) return
    dispatch(addScheduled({ ...schedForm, id: Date.now(), status: 'Scheduled' }))
    toast.success('Notification scheduled')
    setScheduleModalOpen(false)
    setSchedForm({ recipients: 'All Students', message: '', sendAt: '' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <PageWrapper title="Notifications">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setTab('inbox')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'inbox' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}>
            Inbox {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>}
          </button>
          {role === 'admin' && (
            <button onClick={() => setTab('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'scheduled' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}>
              Scheduled
            </button>
          )}
        </div>
        {tab === 'inbox' && unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        )}
        {tab === 'scheduled' && (
          <Button size="sm" onClick={() => setScheduleModalOpen(true)}>+ Schedule Notification</Button>
        )}
      </div>

      {tab === 'inbox' && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {notifications.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-gray-400">No notifications</p>
          )}
          {notifications.map(n => {
            const { icon: Icon, color } = typeIcon[n.type] || typeIcon.lesson
            return (
              <div key={n.id} className={`${!n.read ? 'border-l-4 border-indigo-500' : ''}`}>
                <button
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex items-start gap-4"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
                </button>
                {expandedId === n.id && (
                  <div className="px-6 pb-4 ml-13">
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3">{n.message}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'scheduled' && (
        <div className="space-y-3">
          {scheduled.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm px-6 py-10 text-center text-sm text-gray-400">
              No scheduled notifications
            </div>
          )}
          {scheduled.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.recipients}</p>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{s.message}</p>
                <p className="text-xs text-gray-400 mt-1">Send at: {s.sendAt}</p>
              </div>
              <button onClick={() => dispatch(deleteScheduled(s.id))} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Schedule Notification">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Recipients</label>
            <select value={schedForm.recipients} onChange={e => setSchedForm(f => ({ ...f, recipients: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['All Students', 'Course Students', 'All Teachers'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
            <textarea value={schedForm.message} onChange={e => setSchedForm(f => ({ ...f, message: e.target.value }))} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Send Date & Time</label>
            <input type="datetime-local" value={schedForm.sendAt} onChange={e => setSchedForm(f => ({ ...f, sendAt: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSchedule}>Schedule</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}
