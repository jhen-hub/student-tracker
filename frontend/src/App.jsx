import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ToastContainer from './components/Toast.jsx'
import { useApp } from './context/AppContext.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Students from './pages/Students.jsx'
import StudentDetails from './pages/StudentDetails.jsx'
import Requirements from './pages/Requirements.jsx'
import Reports from './pages/Reports.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import Users from './pages/Users.jsx'
import Settings from './pages/Settings.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentRequirements from './pages/StudentRequirements.jsx'

// Where each role lands after login / on an unknown or unauthorized route.
const ROLE_HOME = {
  Admin: '/dashboard',
  Staff: '/dashboard',
  Student: '/student/dashboard',
}

export default function App() {
  const { currentUser } = useApp()
  const home = currentUser ? ROLE_HOME[currentUser.role] ?? '/profile' : '/login'

  return (
    <>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to={home} replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to={home} replace /> : <Register />} />

        {/* ---- Admin & Staff: shared registrar tools (feature-gated per role inside each page) ---- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['Admin', 'Staff']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute roles={['Admin', 'Staff']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute roles={['Admin', 'Staff']}>
              <StudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requirements"
          element={
            <ProtectedRoute roles={['Admin', 'Staff']}>
              <Requirements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['Admin', 'Staff']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* ---- Student: dedicated personal dashboard / requirements tabs ---- */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute roles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/requirements"
          element={
            <ProtectedRoute roles={['Student']}>
              <StudentRequirements />
            </ProtectedRoute>
          }
        />

        {/* ---- Shared by every signed-in role ---- */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute roles={['Admin', 'Staff', 'Student']}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['Admin', 'Staff', 'Student']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ---- Admin only ---- */}
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
