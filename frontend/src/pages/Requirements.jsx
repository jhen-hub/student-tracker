import { useState } from 'react'
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../context/AppContext.jsx'

const emptyForm = { name: '', description: '' }

export default function Requirements() {
  const { requirements, addRequirement, updateRequirement, deleteRequirement, toggleRequirementActive, currentUser } = useApp()
  const canManage = currentUser?.role === 'Admin'

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(req) {
    setEditingId(req.id)
    setForm({ name: req.name, description: req.description })
    setError('')
    setModalOpen(true)
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Requirement name is required.')
      return
    }
    if (editingId) updateRequirement(editingId, form)
    else addRequirement(form)
    setModalOpen(false)
  }

  return (
    <Layout title="Requirements">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {canManage
            ? 'Manage the document requirements students must complete.'
            : 'View the document requirements students must complete. Only admins can add, edit, or remove requirements.'}
        </p>
        {canManage && (
          <button
            onClick={openAdd}
            className="focus-ring flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            <Plus size={16} /> Add Requirement
          </button>
        )}
      </div>

      {requirements.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requirements yet" message="Add your first document requirement to start tracking submissions." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {requirements.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-base font-semibold text-ink-900">{r.name}</h3>
                <label className={`relative inline-flex items-center ${canManage ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                  <input
                    type="checkbox"
                    checked={r.active}
                    disabled={!canManage}
                    onChange={() => toggleRequirementActive(r.id)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-300 transition-colors peer-checked:bg-accent-500" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
              <p className="mt-1.5 text-sm text-ink-500">{r.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium ${r.active ? 'text-emerald-600' : 'text-ink-500'}`}>
                  {r.active ? 'Active' : 'Inactive'}
                </span>
                {canManage && (
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(r)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-accent-50 hover:text-accent-700" aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(r.id)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Requirement' : 'Add Requirement'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Requirement name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. NCAE Result"
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">{editingId ? 'Save changes' : 'Add requirement'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => deleteRequirement(confirmDeleteId)}
        title="Remove requirement"
        message="This removes the requirement from the catalog. Existing student checklists will keep their current entries."
      />
    </Layout>
  )
}
