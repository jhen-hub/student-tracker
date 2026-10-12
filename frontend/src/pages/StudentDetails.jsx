import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Pencil, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RequirementChecklist from '../components/RequirementChecklist.jsx'
import Modal from '../components/Modal.jsx'
import { useApp, studentOverallStatus, studentCompletion } from '../context/AppContext.jsx'

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    students,
    users,
    updateStudent,
    updateRequirementStatus,
    linkStudentUser,
    unlinkStudentUser,
    currentUser,
    showToast,
  } = useApp()
  const student = students.find((s) => s.id === id)

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    contact: '',
    yearLevel: '1st Year',
    section: '',
  })
  const [linkUserId, setLinkUserId] = useState('')

  const readOnly = currentUser?.role === 'Student'

  if (!student) {
    return (
      <Layout title="Student not found">
        <p className="text-sm text-ink-500">This student record no longer exists.</p>
        <button onClick={() => navigate('/students')} className="mt-4 text-sm font-medium text-accent-700">
          Back to Students
        </button>
      </Layout>
    )
  }

  const linkedUser = users.find((u) => u.id === student.userId) || null

  // Only Student-role users, and only those not already linked to a different
  // student record — so the picker can't create a many-to-one mess.
  const availableUsers = users.filter(
    (u) =>
      u.role === 'Student' &&
      (!u.student_id || u.student_id === student.id)
  )

  const submitted = student.requirements.filter((r) => r.status === 'Submitted').length
  const pending = student.requirements.filter((r) => r.status === 'Pending').length
  const missing = student.requirements.filter((r) => r.status === 'Missing').length

  function handleSaveEdit(e) {
    e.preventDefault()
    updateStudent(student.id, form, 'Updated student information')
    setEditOpen(false)
  }

  // Populate form the moment the user clicks Edit, from the fresh student
  function openEdit() {
    setForm({
      name: student.name,
      email: student.email,
      contact: student.contact,
      yearLevel: student.yearLevel,
      section: student.section,
    })
    setEditOpen(true)
  }

  async function handleLink() {
    if (!linkUserId) return
    try {
      await linkStudentUser(student.id, linkUserId)
      setLinkUserId('')
    } catch {
      // AppContext already showed the error toast
    }
  }

  async function handleUnlink() {
    try {
      await unlinkStudentUser(student.id)
    } catch {
      // AppContext already showed the error toast
    }
  }

  return (
    <Layout title="Student Profile">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-lg font-semibold text-accent-700">
              {student.name[0]}
            </div>
            {!readOnly && (
              <button onClick={openEdit} className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-gray-100 hover:text-ink-900" aria-label="Edit student">
                <Pencil size={16} />
              </button>
            )}
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">{student.name}</h2>
          <p className="text-sm text-ink-500">{student.id} · {student.yearLevel} · {student.section}</p>
          <div className="mt-2"><StatusBadge status={student.status} /></div>

          <div className="mt-5 space-y-2.5 text-sm text-ink-700">
            <div className="flex items-center gap-2"><Mail size={15} className="text-ink-500" /> {student.email}</div>
            <div className="flex items-center gap-2"><Phone size={15} className="text-ink-500" /> {student.contact}</div>
          </div>

          {/* ↓↓ NEW — Linked account ↓↓ */}
          <div className="mt-5 border-t border-ink-300/60 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Linked account
            </p>

            {linkedUser ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{linkedUser.name}</p>
                  <p className="truncate text-xs text-ink-500">{linkedUser.email}</p>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="focus-ring shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Unlink
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-500">Not linked to a user account.</p>
                {!readOnly && (
                  <div className="mt-2 space-y-2">
                    <select
                      value={linkUserId}
                      onChange={(e) => setLinkUserId(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 mb-2 text-sm"
                    >
                      <option value="">Select a Student user…</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleLink}
                      disabled={!linkUserId}
                      className="focus-ring w-full rounded-lg bg-accent-600 py-2 text-xs font-medium text-white hover:bg-accent-700 disabled:opacity-40"
                    >
                      Link account
                    </button>
                    {availableUsers.length === 0 && (
                      <p className="text-[11px] text-ink-500">
                        No unlinked Student accounts available.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-900">Completion</span>
              <span className="text-ink-500">{studentCompletion(student)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-accent-500" style={{ width: `${studentCompletion(student)}%` }} />
            </div>
            <div className="mt-2"><StatusBadge status={studentOverallStatus(student)} /></div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 text-center shadow-card ring-1 ring-black/5">
              <CheckCircle2 className="mx-auto mb-1 text-emerald-600" size={18} />
              <p className="text-lg font-semibold text-ink-900">{submitted}</p>
              <p className="text-xs text-ink-500">Submitted</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-card ring-1 ring-black/5">
              <Clock className="mx-auto mb-1 text-amber-600" size={18} />
              <p className="text-lg font-semibold text-ink-900">{pending}</p>
              <p className="text-xs text-ink-500">Pending</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-card ring-1 ring-black/5">
              <AlertCircle className="mx-auto mb-1 text-rose-600" size={18} />
              <p className="text-lg font-semibold text-ink-900">{missing}</p>
              <p className="text-xs text-ink-500">Missing</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-900">Requirements checklist</h3>
            <RequirementChecklist
              requirements={student.requirements}
              readOnly={readOnly}
              onStatusChange={(reqId, status) => updateRequirementStatus(student.id, reqId, status)}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-900">Activity history</h3>
            <ul className="divide-y divide-ink-300/60 rounded-xl border border-ink-300/60 bg-white">
              {student.activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink-700">{a.text}</span>
                  <span className="text-xs text-ink-500">{a.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student Information">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Contact</label>
              <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Year level</label>
              <select value={form.yearLevel} onChange={(e) => setForm((f) => ({ ...f, yearLevel: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm">
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Section</label>
              <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">Save changes</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
