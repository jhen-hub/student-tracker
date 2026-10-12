import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, ChevronUp, ChevronDown, Users2 } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import SearchBar from '../components/SearchBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp, studentOverallStatus, studentCompletion } from '../context/AppContext.jsx'

const PAGE_SIZE = 6

const emptyForm = {
  name: '',
  email: '',
  contact: '',
  yearLevel: '1st Year',
  section: '',
  status: 'Active',
}

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent, currentUser } = useApp()
  const canDelete = currentUser?.role === 'Admin'
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const yearLevels = ['All', ...new Set(students.map((s) => s.yearLevel))]

  const filtered = useMemo(() => {
    let result = students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      const matchesYear = yearFilter === 'All' || s.yearLevel === yearFilter
      const matchesStatus = statusFilter === 'All' || studentOverallStatus(s) === statusFilter
      return matchesSearch && matchesYear && matchesStatus
    })

    result.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'completion') {
        av = studentCompletion(a)
        bv = studentCompletion(b)
      }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return result
  }, [students, search, yearFilter, statusFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditingId(student.id)
    setForm({
      name: student.name,
      email: student.email,
      contact: student.contact,
      yearLevel: student.yearLevel,
      section: student.section,
      status: student.status,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.section.trim()) e.section = 'Section is required.'
    if (!form.contact.trim()) e.contact = 'Contact number is required.'
    return e
  }

  async function handleSave(e) {
  e.preventDefault()
  const v = validate()
  setFormErrors(v)
  if (Object.keys(v).length > 0) return

  try {
    if (editingId) {
      await updateStudent(editingId, form)
    } else {
      await addStudent(form)
    }
    setModalOpen(false)
  } catch {
    // AppContext already showed a "Failed to …" toast; keep the modal open
    // so the user can fix the input without retyping.
  }
}

  const SortIcon = ({ col }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ChevronUp size={13} />
      ) : (
        <ChevronDown size={13} />
      )
    ) : (
      <ChevronUp size={13} className="opacity-0 group-hover:opacity-40" />
    )

  return (
    <Layout title="Students">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or student ID…" className="w-full sm:w-72" />
        <select
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setPage(1) }}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm"
        >
          {yearLevels.map((y) => (
            <option key={`year-level-${y}`} value={y}>{y === 'All' ? 'All year levels' : y}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm"
        >
          <option value="All">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
          <option value="Incomplete">Incomplete</option>
        </select>

        <button
          onClick={openAdd}
          className="focus-ring ml-auto flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No students found"
          message="Try adjusting your search or filters, or add a new student record."
          action={
            <button onClick={openAdd} className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white">
              Add Student
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort('id')}>
                    <span className="flex items-center gap-1">ID <SortIcon col="id" /></span>
                  </th>
                  <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">Name <SortIcon col="name" /></span>
                  </th>
                  <th className="px-4 py-3">Year / Section</th>
                  <th className="group cursor-pointer select-none px-4 py-3" onClick={() => toggleSort('completion')}>
                    <span className="flex items-center gap-1">Completion <SortIcon col="completion" /></span>
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-300/60">
                {pageItems.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-ink-700">{s.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{s.name}</p>
                      <p className="text-xs text-ink-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{s.yearLevel} · {s.section}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full bg-accent-500" style={{ width: `${studentCompletion(s)}%` }} />
                        </div>
                        <span className="text-xs text-ink-500">{studentCompletion(s)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={studentOverallStatus(s)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => navigate(`/students/${s.id}`)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-accent-50 hover:text-accent-700" aria-label="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => openEdit(s)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-accent-50 hover:text-accent-700" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        {canDelete && (
                          <button onClick={() => setConfirmDeleteId(s.id)} className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-ink-300/60 px-4 py-3 text-sm text-ink-500">
            <span>
              Showing {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-ink-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-ink-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
            {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
              {formErrors.email && <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Contact number</label>
              <input
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
              {formErrors.contact && <p className="mt-1 text-xs text-rose-600">{formErrors.contact}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Year level</label>
              <select
                value={form.yearLevel}
                onChange={(e) => setForm((f) => ({ ...f, yearLevel: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              >
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (
                  <option key={`form-year-level-${y}`} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Section</label>
              <input
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                placeholder="BSIT-1A"
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
              {formErrors.section && <p className="mt-1 text-xs text-rose-600">{formErrors.section}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              >
                <option key="status-active" value="Active">Active</option>
                <option key="status-inactive" value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="focus-ring rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
              {editingId ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => deleteStudent(confirmDeleteId)}
        title="Delete student record"
        message="This will permanently remove the student and their requirements checklist. This action cannot be undone."
      />
    </Layout>
  )
}
