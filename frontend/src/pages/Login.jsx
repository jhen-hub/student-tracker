import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import logo from '../assets/logo.svg'

export default function Login() {
  const { login, loginAsDemo } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('Admin')
  const [error, setError] = useState('')

  function validate() {
    if (!email.trim()) return 'Email is required.'
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
    if (!password) return 'Password is required.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    const result = await login(email, password)   // wait for the Promise
    if (!result.ok) {
      setError(result.error || 'Sign-in failed.')
      return
    }
    navigate(result.user.role === 'Student' ? '/student/dashboard' : '/dashboard')
  }

  async function handleDemoLogin() {
    const result = await loginAsDemo(role)        // wait for the Promise
    if (!result.ok) {
      setError(result.error || 'Demo sign-in failed.')
      return
    }
    navigate(result.user.role === 'Student' ? '/student/dashboard' : '/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl">
            <img src={logo} alt="" className="h-full w-full" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink-900">
            Registrar
          </h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage student compliance records.</p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-card ring-1 ring-black/5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@registrar.edu"
                className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              className="focus-ring w-full rounded-lg bg-accent-600 py-2.5 text-sm font-semibold text-white hover:bg-accent-700"
            >
              Sign in
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
            <div className="h-px flex-1 bg-ink-300/60" />
            or try a demo account
            <div className="h-px flex-1 bg-ink-300/60" />
          </div>

          <div className="space-y-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            >
              <option value="Admin">Demo login as Admin</option>
              <option value="Staff">Demo login as Staff</option>
              <option value="Student">Demo login as Student</option>
            </select>
            <button
              onClick={handleDemoLogin}
              type="button"
              className="focus-ring w-full rounded-lg border border-accent-600 py-2.5 text-sm font-semibold text-accent-700 hover:bg-accent-50"
            >
              Continue as demo {role}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-accent-700 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}