import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Palette } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Settings() {
  const { settings, updateSettings, requirements } = useApp()
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleDefaultReq(name) {
    setForm((f) => ({
      ...f,
      defaultRequirements: f.defaultRequirements.includes(name)
        ? f.defaultRequirements.filter((r) => r !== name)
        : [...f.defaultRequirements, name],
    }))
  }

  return (
    <Layout title="Settings">
      <form onSubmit={handleSave} className="max-w-2xl space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <SettingsIcon size={16} className="text-accent-600" /> General
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">School name</label>
              <input
                value={form.schoolName}
                onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Academic year</label>
              <input
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Default requirements for new students</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {requirements.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={form.defaultRequirements.includes(r.name)}
                  onChange={() => toggleDefaultReq(r.name)}
                  className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-500"
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Bell size={16} className="text-accent-600" /> Notification preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm text-ink-700">
              Notify staff of missing requirements
              <input
                type="checkbox"
                checked={form.notifyMissing}
                onChange={(e) => setForm((f) => ({ ...f, notifyMissing: e.target.checked }))}
                className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-500"
              />
            </label>
            <label className="flex items-center justify-between text-sm text-ink-700">
              Notify staff of upcoming deadlines
              <input
                type="checkbox"
                checked={form.notifyDeadlines}
                onChange={(e) => setForm((f) => ({ ...f, notifyDeadlines: e.target.checked }))}
                className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-500"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Palette size={16} className="text-accent-600" /> Theme
          </h3>
          <div className="flex gap-3">
            {['light', 'dark'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, theme: t }))}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize ${
                  form.theme === t ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-ink-300 text-ink-700 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-500">Dark theme is saved as a preference; this prototype renders in light mode only.</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="focus-ring rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-700">
            Save settings
          </button>
          {saved && <span className="text-sm text-emerald-600">Settings saved.</span>}
        </div>
      </form>
    </Layout>
  )
}
