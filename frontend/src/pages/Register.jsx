import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import logo from '../assets/logo.svg'

export default function Register() {
  const { register } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    role: 'Staff',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  async function handleSubmit(evt) {
    evt.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
    const result = await register({ ...form, name: fullName })
    if (!result.ok) {
      setErrors({ email: result.error || 'Registration failed.' })
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 1600)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-black/5">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={26} />
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Account created</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            This is a demo account stored in your browser. Redirecting you to sign in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl">
            <img src={logo} alt="" className="h-full w-full" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink-900">Create an account</h1>
          <p className="mt-1 text-sm text-ink-500">No backend yet — this creates a mock frontend account.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-2xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                  placeholder="First name"
                />
                {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName}</p>}
              </div>
              <div>
                <input
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                  placeholder="Last name"
                />
                {errors.lastName && <p className="mt-1 text-xs text-rose-600">{errors.lastName}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
            <input
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              placeholder="you@registrar.edu"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            >
              <option value="Staff">Staff</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
            {errors.confirm && <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            className="focus-ring w-full rounded-lg bg-accent-600 py-2.5 text-sm font-semibold text-white hover:bg-accent-700"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}