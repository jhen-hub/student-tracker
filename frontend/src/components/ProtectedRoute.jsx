import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const ROLE_HOME = {
  Admin: '/dashboard',
  Staff: '/dashboard',
  Student: '/student/dashboard',
}

export default function ProtectedRoute({ roles, children }) {
  const { currentUser } = useApp()

  if (!currentUser) return <Navigate to="/login" replace />
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to={ROLE_HOME[currentUser.role] ?? '/profile'} replace />
  }

  return children
}
