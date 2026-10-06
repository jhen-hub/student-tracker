import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initialStudents } from '../data/students.js'
import { initialRequirements } from '../data/requirements.js'
import { initialUsers } from '../data/users.js'
import { initialNotifications } from '../data/notifications.js'

const AppContext = createContext(null)

const STORAGE_KEY = 'srdts-mock-data-v1'

const defaultSettings = {
  schoolName: 'ICCT Colleges',
  academicYear: '2026-2027',
  defaultRequirements: initialRequirements.filter((r) => r.active).map((r) => r.name),
  notifyMissing: true,
  notifyDeadlines: true,
  theme: 'light',
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function statusCounts(requirements) {
  return requirements.reduce(
    (acc, r) => {
      if (r.status === 'Submitted') acc.submitted += 1
      else if (r.status === 'Pending') acc.pending += 1
      else acc.missing += 1
      return acc
    },
    { submitted: 0, pending: 0, missing: 0 },
  )
}

export function studentCompletion(student) {
  const total = student.requirements.length || 1
  const { submitted } = statusCounts(student.requirements)
  return Math.round((submitted / total) * 100)
}

export function studentOverallStatus(student) {
  const { submitted, missing } = statusCounts(student.requirements)
  if (submitted === student.requirements.length) return 'Complete'
  if (missing > 0) return 'Incomplete'
  return 'Pending'
}

let idCounter = 1000

function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function AppProvider({ children }) {
  const persisted = loadPersisted()

  const [students, setStudents] = useState(persisted?.students ?? initialStudents)
  const [requirements, setRequirements] = useState(persisted?.requirements ?? initialRequirements)
  const [users, setUsers] = useState(persisted?.users ?? initialUsers)
  const [notifications, setNotifications] = useState(persisted?.notifications ?? initialNotifications)
  const [settings, setSettings] = useState(persisted?.settings ?? defaultSettings)
  const [currentUser, setCurrentUser] = useState(persisted?.currentUser ?? null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ students, requirements, users, notifications, settings, currentUser }),
    )
  }, [students, requirements, users, notifications, settings, currentUser])

  const showToast = useCallback((message, type = 'success') => {
    const id = nextId('TST')
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---- Auth ----
  const login = useCallback(
    (email, password) => {
      const user = users.find(
        (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password,
      )
      if (!user) return { ok: false, error: 'Incorrect email or password.' }
      if (user.status === 'Inactive') return { ok: false, error: 'This account has been deactivated.' }
      setCurrentUser(user)
      return { ok: true, user }
    },
    [users],
  )

  const loginAsDemo = useCallback(
    (role) => {
      const user = users.find((u) => u.role === role)
      if (user) setCurrentUser(user)
      return user
    },
    [users],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  // ---- Students ----
  const addStudent = useCallback(
    (data) => {
      const defaultReqs = requirements
        .filter((r) => r.active)
        .map((r) => ({ id: r.id, name: r.name, status: 'Missing' }))
      const student = {
        id: nextId('STU'),
        status: 'Active',
        enrolled: new Date().toISOString().slice(0, 10),
        requirements: defaultReqs,
        activity: [{ date: new Date().toISOString().slice(0, 10), text: 'Student record created' }],
        ...data,
      }
      setStudents((prev) => [student, ...prev])
      showToast(`${student.name} was added.`)
      return student
    },
    [requirements, showToast],
  )

  const updateStudent = useCallback(
    (id, patch, activityText) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                activity: activityText
                  ? [{ date: new Date().toISOString().slice(0, 10), text: activityText }, ...s.activity]
                  : s.activity,
              }
            : s,
        ),
      )
      showToast('Student record updated.')
    },
    [showToast],
  )

  const deleteStudent = useCallback(
    (id) => {
      setStudents((prev) => prev.filter((s) => s.id !== id))
      showToast('Student record deleted.', 'danger')
    },
    [showToast],
  )

  const updateRequirementStatus = useCallback(
    (studentId, reqId, status) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                requirements: s.requirements.map((r) => (r.id === reqId ? { ...r, status } : r)),
                activity: [
                  {
                    date: new Date().toISOString().slice(0, 10),
                    text: `Marked "${s.requirements.find((r) => r.id === reqId)?.name}" as ${status}`,
                  },
                  ...s.activity,
                ],
              }
            : s,
        ),
      )
    },
    [],
  )

  // ---- Register ----
  const register = useCallback(
    (data) => {
      const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())
      if (exists) return { ok: false, error: 'An account with this email already exists.' }
      let studentId = null;
      if (data.role === 'Student') {
        const studentData = {
          name: data.name,
          email: data.email,
          contact: '',
          yearLevel: '1st Year',
          section: '',
          status: 'Active',
        };
        const student = addStudent(studentData);
        studentId = student.id;
      }
      const newUser = {
        id: nextId('USR'),
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        status: 'Active',
        ...(studentId !== null ? { studentId } : {}),
      }
      setUsers((prev) => [...prev, newUser])
      return { ok: true, user: newUser }
    },
    [users, addStudent],
  )

  // ---- Requirements catalog ----
  const addRequirement = useCallback(
    (data) => {
      const req = { id: nextId('REQ'), active: true, ...data }
      setRequirements((prev) => [...prev, req])
      showToast(`Requirement "${req.name}" added.`)
      return req
    },
    [showToast],
  )

  const updateRequirement = useCallback(
    (id, patch) => {
      setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      showToast('Requirement updated.')
    },
    [showToast],
  )

  const deleteRequirement = useCallback(
    (id) => {
      setRequirements((prev) => prev.filter((r) => r.id !== id))
      showToast('Requirement removed.', 'danger')
    },
    [showToast],
  )

  const toggleRequirementActive = useCallback((id) => {
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
  }, [])

  // ---- Users ----
  const addUser = useCallback(
    (data) => {
      const user = { id: nextId('USR'), status: 'Active', ...data }
      setUsers((prev) => [...prev, user])
      showToast(`User "${user.name}" added.`)
      return user
    },
    [showToast],
  )

  const updateUser = useCallback(
    (id, patch) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      setCurrentUser((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev))
      showToast('User updated.')
    },
    [showToast],
  )

  const deleteUser = useCallback(
    (id) => {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showToast('User removed.', 'danger')
    },
    [showToast],
  )

  const toggleUserStatus = useCallback((id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u)),
    )
  }, [])

  // ---- Notifications ----
  const addNotification = useCallback(
    (data) => {
      const n = {
        id: nextId('NTF'),
        date: new Date().toISOString().slice(0, 10),
        read: false,
        ...data,
      }
      setNotifications((prev) => [n, ...prev])
      showToast('Reminder created.')
      return n
    },
    [showToast],
  )

  const markNotificationRead = useCallback((id, read = true) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)))
  }, [])

  const deleteNotification = useCallback(
    (id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      showToast('Notification deleted.', 'danger')
    },
    [showToast],
  )

  // ---- Settings ----
  const updateSettings = useCallback(
    (patch) => {
      setSettings((prev) => ({ ...prev, ...patch }))
      showToast('Settings saved.')
    },
    [showToast],
  )

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
    addStudent,
    updateStudent,
    deleteStudent,
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