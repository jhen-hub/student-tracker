import { useState } from 'react'
import { User } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Profile() {
  const { currentUser, updateUser } = useApp()

  const [info, setInfo] = useState({ name: currentUser?.name ?? '', email: currentUser?.email ?? '' })
  const [infoSaved, setInfoSaved] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  function handleInfoSave(e) {
    e.preventDefault()
    updateUser(currentUser.id, { name: info.name, email: info.email })
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2000)
  }

  function handlePasswordSave(e) {
    e.preventDefault()
    setPwError('')
    if (pwForm.current !== currentUser.password) {
      setPwError('Current password is incorrect.')
      return
    }
    if (pwForm.next.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    updateUser(currentUser.id, { password: pwForm.next })
    setPwForm({ current: '', next: '', confirm: '' })
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  return (
    <Layout title="Edit Profile">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-black/5 lg:col-span-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-xl font-semibold text-accent-700">
            {currentUser?.name?.[0]}
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">{currentUser?.name}</h2>
          <p className="text-sm text-ink-500">{currentUser?.email}</p>
          <div className="mt-2 flex justify-center">
            <StatusBadge status={currentUser?.role} />
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <form onSubmit={handleInfoSave} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
              <User size={16} className="text-accent-600" /> Profile information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
                <input
                  value={info.name}
                  onChange={(e) => setInfo((f) => ({ ...f, name: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
                <input
                  value={info.email}
                  onChange={(e) => setInfo((f) => ({ ...f, email: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
                Save changes
              </button>
              {infoSaved && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
          </form>

          <form onSubmit={handlePasswordSave} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
            <h3 className="mb-4 text-sm font-semibold text-ink-900">Change password</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Current password</label>
                <input
                  type="password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">New password</label>
                <input
                  type="password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Confirm new password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {pwError && <p className="mt-3 text-sm text-rose-600">{pwError}</p>}
            <div className="mt-4 flex items-center gap-3">
              <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
                Update password
              </button>
              {pwSaved && <span className="text-sm text-emerald-600">Password updated.</span>}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
