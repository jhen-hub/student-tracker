import { useMemo, useState } from 'react'
import { Bell, BellOff, Trash2, Plus } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'

const ROLE_OPTIONS = ['Admin', 'Staff', 'Student']

function recipientLabel(n, users) {
  if (n.recipient_type === 'All') return 'Everyone'
  if (n.recipient_type === 'Role') return `All ${n.recipient_value}s`
  if (n.recipient_type === 'User') {
    const u = users.find((x) => x.id === n.recipient_value)
    return u ? `${u.name} (${u.role})` : n.recipient_value
  }
  return '—'
}

export default function Notifications() {
  const {
    notifications,
    markNotificationRead,
    deleteNotification,
    addNotification,
    users,
    currentUser,
  } = useApp()
  const canCreate = currentUser?.role === 'Admin' || currentUser?.role === 'Staff'

  const [unreadOnly, setUnreadOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    scope: 'All',       // 'All' | 'Role' | 'User'
    role: 'Student',    // used when scope === 'Role'
    userId: '',         // used when scope === 'User'
    message: '',
  })

  const list = useMemo(
    () => (unreadOnly ? notifications.filter((n) => !n.read) : notifications),
    [notifications, unreadOnly],
  )

  const usersForPicker = useMemo(
    () => users.filter((u) => u.status === 'Active'),
    [users],
  )

  async function handleCreate(e) {
    e.preventDefault()

    let recipient_type = 'All'
    let recipient_value = null
    let titleSuffix = 'Everyone'

    if (form.scope === 'Role') {
      recipient_type = 'Role'
      recipient_value = form.role
      titleSuffix = `All ${form.role}s`
    } else if (form.scope === 'User') {
      const target = users.find((u) => u.id === form.userId)
      if (!target) return
      recipient_type = 'User'
      recipient_value = target.id
      titleSuffix = target.name
    }

    try {
      await addNotification({
        title: `Reminder — ${titleSuffix}`,
        message: form.message || 'Please check the registrar for updates.',
        recipient_type,
        recipient_value,
      })
      setForm({ scope: 'All', role: 'Student', userId: '', message: '' })
      setModalOpen(false)
    } catch {
      // AppContext already showed the error toast
    }
  }

  return (
    <Layout title="Notifications">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`focus-ring rounded-lg border px-4 py-2 text-sm font-medium ${unreadOnly ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-ink-300 bg-white text-ink-700 hover:bg-gray-50'}`}
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
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-card ${n.read ? 'border-ink-300/60 bg-white' : 'border-accent-200 bg-accent-50/40'}`}
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
                <p className="mt-1 text-xs text-ink-500">
                  To: <span className="font-medium">{recipientLabel(n, users)}</span>
                </p>
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
            <label className="mb-1 block text-sm font-medium text-ink-700">Send to</label>
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            >
              <option value="All">Everyone</option>
              <option value="Role">Everyone with a role…</option>
              <option value="User">A specific user…</option>
            </select>
          </div>

          {form.scope === 'Role' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {form.scope === 'User' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">User</label>
              <select
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              >
                <option value="">Select a user…</option>
                {usersForPicker.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role}
                  </option>
                ))}
              </select>
            </div>
          )}

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