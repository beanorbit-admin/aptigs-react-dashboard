import { Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { markAsRead } from '../../store/slices/notificationSlice'
import { formatDistanceToNow } from '../../utils/formatters'

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Header({ title }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { role, user } = useAppSelector(state => state.auth)
  const notifications = useAppSelector(state => state.notifications.list)
  const unreadCount = notifications.filter(n => !n.is_read).length
  const recent = notifications.slice(0, 5)
  const displayName = user?.name || (role === 'admin' ? 'Admin User' : 'Teacher')

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {recent.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500 text-center">No notifications</p>
                ) : (
                  recent.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { dispatch(markAsRead(n.id)); setDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!n.is_read ? 'border-l-2 border-indigo-500' : ''}`}
                    >
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(n.created_at)}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/notifications') }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full text-center"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
          {getInitials(displayName)}
        </div>
      </div>
    </header>
  )
}
