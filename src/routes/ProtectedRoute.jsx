import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, role } = useAppSelector(state => state.auth)

  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}
