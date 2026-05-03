import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, UserCheck,
  ClipboardList, HelpCircle, Calendar, CreditCard, Bell, LogOut
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { logout } from '../../store/slices/authSlice'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/enrollments', label: 'Enrollments', icon: BookOpen },
  { to: '/courses', label: 'Courses', icon: GraduationCap },
  { to: '/teachers', label: 'Teacher Management', icon: UserCheck, adminOnly: true },
  { to: '/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/questions', label: 'Questions', icon: HelpCircle },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { role, user } = useAppSelector(state => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const displayName = user?.name || (role === 'admin' ? 'Admin User' : 'Teacher')

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-30" style={{ backgroundColor: '#1E1B4B' }}>
      <div className="px-6 py-5 border-b border-indigo-900">
        <span className="text-white text-xl font-bold tracking-wide">Aptigs</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navLinks.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && role !== 'admin') return null
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role === 'admin' ? 'bg-amber-500 text-white' : 'bg-indigo-400 text-white'}`}>
              {role === 'admin' ? 'Admin' : 'Teacher'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-200 hover:bg-red-600 hover:text-white transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
