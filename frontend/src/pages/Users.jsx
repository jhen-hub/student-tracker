import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import SearchBar from '../components/SearchBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'

// 1. Added status to emptyForm
const emptyForm = { name: '', email: '', role: 'Staff', password: '', status: 'Active' }

export default function Users() {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'All' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditingId(u.id)
    // 2. Populate the status field
    setForm({ name: u.name, email: u.email, role: u.role, password: '', status: u.status })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.')
      return
    }
    try {
      setIsSaving(true)
      if (editingId) {
        // 3. Include status in the patch payload
        const patch = { name: form.name, email: form.email, role: form.role, status: form.status }
        if (form.password) patch.password = form.password
        await updateUser(editingId, patch)
      } else {
        if (!form.password) {
          setError('Password is required for new users.')
          setIsSaving(false)
          return
        }
        await addUser(form)
      }
      setModalOpen(false)
    } catch {
      // keep modal open
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Layout title="User Management">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" className="w-full sm:w-72" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm">
          <option value="All">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Staff">Staff</option>
          <option value="Student">Student</option>
        </select>
        <button
          onClick={openAdd}
          className="focus-ring ml-auto flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No users found" message="Try a different search or add a new user account." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-300/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                    <td className="px-4 py-3 text-ink-700">{u.email}</td>
                    <td className="px-4 py-3 text-ink-700">{u.role}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUserStatus(u.id)} disabled={u.id === currentUser?.id}>
                        <StatusBadge status={u.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-accent-50 hover:text-accent-700" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          disabled={u.id === currentUser?.id}
                          className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={isSaving ? () => { } : () => setModalOpen(false)} title={editingId ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          </div>

          {/* 4. Added Status dropdown in a 2-column grid with Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm">
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">{editingId ? 'New password (optional)' : 'Password'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} disabled={isSaving} className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
              {isSaving ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save changes' : 'Add user')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => deleteUser(confirmDeleteId)}
        title="Delete user"
        message="This will permanently remove the user's account access."
      />
    </Layout>
  )
}