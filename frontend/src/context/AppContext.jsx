import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { loginSession, logoutSession, getMe } from '../api/services/authService'
import {
  listUsers,
  login as apiLogin,
  register as apiRegister,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  getUser as apiGetUser,
  changePassword as apiChangePassword,
} from '../api/services/usersService'

import {
  listStudents,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  linkStudentToUser as apiLinkStudentToUser,
  unlinkStudentUser as apiUnlinkStudentUser,
} from '../api/services/studentsService'

import {
  listRequirements,
  createRequirement as apiCreateRequirement,
  updateRequirement as apiUpdateRequirement,
  deleteRequirement as apiDeleteRequirement,
  getRequirement as apiGetRequirement,
} from '../api/services/requirementsService'

import {
  listNotifications,
  createNotification as apiCreateNotification,
  updateNotification as apiUpdateNotification,
  deleteNotification as apiDeleteNotification,
} from '../api/services/notificationsService'

import { listSettings, updateSetting as apiUpdateSetting } from '../api/services/settingsService'
import { updateStudentRequirementStatus as apiUpdateStudentRequirementStatus } from '../api/services/studentRequirementsService'
import { registerServiceWorker, subscribeToPush, pushSupported } from '../api/services/pushService'

/**
 * Calculate student completion percentage
 */
export function studentCompletion(student) {
  const total = student.requirements.length || 1
  const submitted = student.requirements.filter(r => r.status === 'Submitted').length
  return Math.round((submitted / total) * 100)
}

/**
 * Determine overall student status based on requirements
 */
export function studentOverallStatus(student) {
  const { submitted, missing } = student.requirements.reduce(
    (acc, r) => {
      if (r.status === 'Submitted') acc.submitted += 1
      else if (r.status === 'Missing') acc.missing += 1
      return acc
    },
    { submitted: 0, missing: 0 }
  )
  if (submitted === student.requirements.length) return 'Complete'
  if (missing > 0) return 'Incomplete'
  return 'Pending'
}

function deserializeSettings(rawArray) {
  const obj = {}
  for (const { key, value } of rawArray) {
    if (key === 'defaultRequirements') {
      if (Array.isArray(value)) {
        obj[key] = value
      } else {
        try {
          obj[key] = JSON.parse(value)
        } catch {
          obj[key] = []
        }
      }
    } else if (value === 'true') {
      obj[key] = true
    } else if (value === 'false') {
      obj[key] = false
    } else {
      obj[key] = value
    }
  }
  return obj
}

function serializeSettingValue(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value !== null && typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [students, setStudents] = useState([])
  const [requirements, setRequirements] = useState([])
  const [users, setUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  // ---- Initial data ----
  useEffect(() => {
    const bootstrap = async () => {
      // Non-user-scoped data (fetched regardless of login state)
      try {
        const [studentsData, requirementsData, usersData, settingsData] = await Promise.all([
          listStudents(),
          listRequirements(),
          listUsers(),
          listSettings(),
        ])
        setStudents(studentsData)
        setRequirements(requirementsData)
        setUsers(usersData)
        setSettings(deserializeSettings(settingsData))
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
        setError(err.message)
      }

      // Restore session from the cookie, if any
      try {
        const me = await getMe()
        setCurrentUser(me)
      } catch {
        setCurrentUser(null)
      }

      setLoading(false)
    }

    bootstrap()
  }, [])

  // ---- Push: register the service worker once ----
  useEffect(() => {
    registerServiceWorker().catch((err) =>
      console.warn('Service worker registration failed:', err)
    )
  }, [])

  // ---- Push: silently re-subscribe on login IF permission was already granted ----
  // We never prompt here — that's what the "Enable alerts" button is for.
  useEffect(() => {
    if (!currentUser) {
      setNotifications([])
      return
    }
    listNotifications(currentUser.id)
      .then(setNotifications)
      .catch((err) => console.warn('Failed to load notifications:', err))
  }, [currentUser])

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ---- Auth ----
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      const user = await loginSession(email, password)
      setCurrentUser(user)
      setLoading(false)
      return { ok: true, user }
    } catch (err) {
      setLoading(false)
      return { ok: false, error: err.body?.error || err.message }
    }
  }, [])


  const loginAsDemo = useCallback(async (role) => {
    const credentials = {
      Admin: { email: 'admin@registrar.edu', password: 'admin123' },
      Staff: { email: 'staff@registrar.edu', password: 'staff123' },
      Student: { email: 'student@registrar.edu', password: 'student123' },
    }
    const cred = credentials[role]
    if (!cred) return { ok: false, error: 'Invalid demo role' }
    return await login(cred.email, cred.password)
  }, [login])

  const logout = useCallback(async () => {
    try {
      await logoutSession()
    } catch (err) {
      console.warn('Logout request failed:', err)
    }
    setCurrentUser(null)
    setNotifications([])
  }, [])

  const register = useCallback(async (data) => {
    try {
      setLoading(true)
      const newUser = await apiRegister(data)
      setLoading(false)
      return { ok: true, user: newUser }
    } catch (err) {
      setLoading(false)
      return { ok: false, error: err.body?.error || err.message }
    }
  }, [])

  // ---- Password ----
  const changePassword = useCallback(async (id, currentPassword, newPassword) => {
    try {
      setLoading(true)
      await apiChangePassword(id, currentPassword, newPassword)
      setLoading(false)
      return { ok: true }
    } catch (err) {
      setLoading(false)
      return { ok: false, error: err.body?.error || err.message }
    }
  }, [])

  // ---- Students ----
  const addStudent = useCallback(async (data) => {
    try {
      setLoading(true)
      const student = await apiCreateStudent(data)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast(`${student.name} was added.`)
      return student
    } catch (err) {
      setLoading(false)
      showToast('Failed to add student', 'danger')
      throw err
    }
  }, [showToast])

  const updateStudent = useCallback(async (id, patch) => {
    try {
      setLoading(true)
      const student = await apiUpdateStudent(id, patch)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast('Student record updated.')
      return student
    } catch (err) {
      setLoading(false)
      showToast('Failed to update student', 'danger')
      throw err
    }
  }, [showToast])

  const deleteStudent = useCallback(async (id) => {
    try {
      setLoading(true)
      await apiDeleteStudent(id)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast('Student record deleted.', 'danger')
    } catch (err) {
      setLoading(false)
      showToast('Failed to delete student', 'danger')
      throw err
    }
  }, [showToast])

  const linkStudentUser = useCallback(async (studentId, userId) => {
    try {
      setLoading(true)
      await apiLinkStudentToUser(studentId, userId)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast('Account linked.')
    } catch (err) {
      setLoading(false)
      showToast(err.body?.error || 'Failed to link account', 'danger')
      throw err
    }
  }, [showToast])

  const unlinkStudentUser = useCallback(async (studentId) => {
    try {
      setLoading(true)
      await apiUnlinkStudentUser(studentId)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast('Account unlinked.', 'danger')
    } catch (err) {
      setLoading(false)
      showToast('Failed to unlink account', 'danger')
      throw err
    }
  }, [showToast])

  const updateRequirementStatus = useCallback(async (studentId, reqId, status) => {
    try {
      setLoading(true)
      await apiUpdateStudentRequirementStatus(studentId, reqId, status)
      const updatedStudents = await listStudents()
      setStudents(updatedStudents)
      setLoading(false)
      showToast('Requirement status updated.')
    } catch (err) {
      setLoading(false)
      showToast('Failed to update requirement status', 'danger')
    }
  }, [showToast])

  // ---- Requirements catalog ----
  const addRequirement = useCallback(async (data) => {
    try {
      setLoading(true)
      const requirement = await apiCreateRequirement(data)
      const updatedRequirements = await listRequirements()
      setRequirements(updatedRequirements)
      setLoading(false)
      showToast(`Requirement "${requirement.name}" added.`)
      return requirement
    } catch (err) {
      setLoading(false)
      showToast('Failed to add requirement', 'danger')
      throw err
    }
  }, [showToast])

  const updateRequirement = useCallback(async (id, patch) => {
    try {
      setLoading(true)
      const requirement = await apiUpdateRequirement(id, patch)
      const updatedRequirements = await listRequirements()
      setRequirements(updatedRequirements)
      setLoading(false)
      showToast('Requirement updated.')
      return requirement
    } catch (err) {
      setLoading(false)
      showToast('Failed to update requirement', 'danger')
      throw err
    }
  }, [showToast])

  const deleteRequirement = useCallback(async (id) => {
    try {
      setLoading(true)
      await apiDeleteRequirement(id)
      const updatedRequirements = await listRequirements()
      setRequirements(updatedRequirements)
      setLoading(false)
      showToast('Requirement removed.', 'danger')
    } catch (err) {
      setLoading(false)
      showToast('Failed to delete requirement', 'danger')
      throw err
    }
  }, [showToast])

  const toggleRequirementActive = useCallback(async (id) => {
    try {
      setLoading(true)
      const requirement = await apiGetRequirement(id)
      await apiUpdateRequirement(id, { active: !requirement.active })
      const updatedRequirements = await listRequirements()
      setRequirements(updatedRequirements)
      setLoading(false)
      showToast('Requirement updated.')
    } catch (err) {
      setLoading(false)
      showToast('Failed to toggle requirement', 'danger')
    }
  }, [showToast])

  // ---- Users ----
  const addUser = useCallback(async (data) => {
    try {
      setLoading(true)
      const user = await apiCreateUser(data)
      const updatedUsers = await listUsers()
      setUsers(updatedUsers)
      setLoading(false)
      showToast(`User "${user.name}" added.`)
      return user
    } catch (err) {
      setLoading(false)
      showToast('Failed to add user', 'danger')
      throw err
    }
  }, [showToast])

  const updateUser = useCallback(async (id, patch) => {
    try {
      setLoading(true)
      const user = await apiUpdateUser(id, patch)
      const updatedUsers = await listUsers()
      setUsers(updatedUsers)
      if (currentUser && currentUser.id === id) {
        setCurrentUser(prev => prev ? { ...prev, ...patch } : prev)
      }
      setLoading(false)
      showToast('User updated.')
      return user
    } catch (err) {
      setLoading(false)
      showToast('Failed to update user', 'danger')
      throw err
    }
  }, [currentUser, showToast])

  const deleteUser = useCallback(async (id) => {
    try {
      setLoading(true)
      await apiDeleteUser(id)
      const updatedUsers = await listUsers()
      setUsers(updatedUsers)
      if (currentUser && currentUser.id === id) {
        setCurrentUser(null)
      }
      setLoading(false)
      showToast('User removed.', 'danger')
    } catch (err) {
      setLoading(false)
      showToast('Failed to delete user', 'danger')
      throw err
    }
  }, [currentUser, showToast])

  const toggleUserStatus = useCallback(async (id) => {
    try {
      setLoading(true)
      const user = await apiGetUser(id)
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
      await apiUpdateUser(id, { status: newStatus })
      const updatedUsers = await listUsers()
      setUsers(updatedUsers)
      if (currentUser && currentUser.id === id) {
        setCurrentUser(prev => prev ? { ...prev, status: newStatus } : prev)
      }
      setLoading(false)
      showToast('User status toggled.')
    } catch (err) {
      setLoading(false)
      showToast('Failed to toggle user status', 'danger')
    }
  }, [currentUser, showToast])

  // ---- Notifications ----
  const addNotification = useCallback(async (data) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        notification_date: data.notification_date || new Date().toISOString().slice(0, 10),
      }
      const notification = await apiCreateNotification(payload)
      const updatedNotifications = await listNotifications(currentUser?.id)
      setNotifications(updatedNotifications)
      setLoading(false)
      showToast('Reminder created.')
      return notification
    } catch (err) {
      setLoading(false)
      showToast('Failed to add notification', 'danger')
      throw err
    }
  }, [currentUser, showToast])

  const markNotificationRead = useCallback(async (id, read = true) => {
    try {
      setLoading(true)
      await apiUpdateNotification(id, { read })
      const updatedNotifications = await listNotifications()
      setNotifications(updatedNotifications)
      setLoading(false)
    } catch (err) {
      setLoading(false)
      showToast('Failed to update notification', 'danger')
    }
  }, [showToast])

  const deleteNotification = useCallback(async (id) => {
    try {
      setLoading(true)
      await apiDeleteNotification(id)
      const updatedNotifications = await listNotifications()
      setNotifications(updatedNotifications)
      setLoading(false)
      showToast('Notification deleted.', 'danger')
    } catch (err) {
      setLoading(false)
      showToast('Failed to delete notification', 'danger')
      throw err
    }
  }, [showToast])

  // ---- Settings ----
  const updateSettings = useCallback(async (patch) => {
    try {
      setLoading(true)
      await Promise.all(
        Object.entries(patch).map(([key, value]) =>
          apiUpdateSetting(key, { value: serializeSettingValue(value) })
        )
      )
      const updatedSettings = await listSettings()
      setSettings(deserializeSettings(updatedSettings))
      setLoading(false)
      showToast('Settings saved.')
    } catch (err) {
      setLoading(false)
      showToast('Failed to save settings', 'danger')
    }
  }, [showToast])

  const value = {
    students,
    requirements,
    users,
    notifications,
    settings,
    currentUser,
    toasts,
    showToast,
    dismissToast,
    login,
    loginAsDemo,
    logout,
    register,
    changePassword,
    addStudent,
    updateStudent,
    deleteStudent,
    linkStudentUser,
    unlinkStudentUser,
    updateRequirementStatus,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    toggleRequirementActive,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    addNotification,
    markNotificationRead,
    deleteNotification,
    updateSettings,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}