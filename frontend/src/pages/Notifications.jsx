import { useMemo, useState } from 'react'
import { Bell, BellOff, Trash2, Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Notifications() {
  const { notifications, markNotificationRead, deleteNotification, addNotification, students, currentUser } = useApp()
  const canCreate = currentUser?.role === 'Admin' || currentUser?.role === 'Staff'
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ studentId: '', message: '' })

  const list = useMemo(
    () => (unreadOnly ? notifications.filter((n) => !n.read) : notifications),
    [notifications, unreadOnly],
  )

  function handleCreate(e) {
    e.preventDefault()
    const student = students.find((s) => s.id === form.studentId)
    addNotification({
      title: student ? `Reminder — ${student.name}` : 'New reminder',
      message: form.message || `Please complete your remaining requirements.`,
    })
    setForm({ studentId: '', message: '' })
    setModalOpen(false)
  }

  return (
    <Layout title="Notifications">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`focus-ring rounded-lg border px-4 py-2 text-sm font-medium ${
            unreadOnly ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-ink-300 bg-white text-ink-700 hover:bg-gray-50'
          }`}
        >
          {unreadOnly ? 'Showing unread only' : 'Show unread only'}
        </button>
        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="focus-ring ml-auto flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            <Plus size={16} /> Create Reminder
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-card ${
                n.read ? 'border-ink-300/60 bg-white' : 'border-accent-200 bg-accent-50/40'
              }`}
            >
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-gray-100 text-ink-500' : 'bg-accent-100 text-accent-600'}`}>
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.read ? 'text-ink-700' : 'text-ink-900'}`}>{n.title}</p>
                  <span className="shrink-0 text-xs text-ink-500">{n.date}</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">{n.message}</p>
                <div className="mt-2 flex gap-3 text-xs font-medium">
                  <button onClick={() => markNotificationRead(n.id, !n.read)} className="flex items-center gap-1 text-accent-700 hover:underline">
                    {n.read ? <><Bell size={12} /> Mark as unread</> : <><BellOff size={12} /> Mark as read</>}
                  </button>
                  <button onClick={() => deleteNotification(n.id)} className="flex items-center gap-1 text-rose-600 hover:underline">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Reminder">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Student</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            >
              <option value="">General reminder (no specific student)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={3}
              placeholder="e.g. Please submit your Valid ID before Friday."
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">Create reminder</button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
