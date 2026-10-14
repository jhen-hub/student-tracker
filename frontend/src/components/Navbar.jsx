import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, BellRing, BellOff, LogOut, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import {
  subscribeToPush,
  unsubscribeFromPush,
  pushSupported,
  getExistingSubscription,
} from '../api/services/pushService.js'

export default function Navbar({ onOpenMobile, title }) {
  const { currentUser, notifications, logout, showToast } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const ref = useRef(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Re-check subscription state whenever the viewer changes (login / logout).
  useEffect(() => {
    if (!pushSupported()) return
    getExistingSubscription()
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => setPushEnabled(false))
  }, [currentUser])

  async function handleEnablePush() {
    try {
      await subscribeToPush(currentUser.id)
      setPushEnabled(true)
      showToast('Push notifications enabled.')
    } catch (err) {
      showToast(err.message || 'Failed to enable push', 'danger')
    }
  }

  async function handleDisablePush() {
    try {
      await unsubscribeFromPush(currentUser.id)
      setPushEnabled(false)
      showToast('Push notifications disabled.', 'danger')
    } catch (err) {
      showToast(err.message || 'Failed to disable push', 'danger')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-300/60 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
      <button onClick={onOpenMobile} className="text-ink-700 md:hidden">
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-ink-900">{title}</h1>

      <div className="ml-auto flex items-center gap-4">
        {pushSupported() && currentUser && (
          pushEnabled ? (
            <button
              onClick={handleDisablePush}
              className="focus-ring hidden items-center gap-1.5 rounded-lg border border-ink-300 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-gray-50 sm:flex"
            >
              <BellOff size={13} /> Disable alerts
            </button>
          ) : (
            <button
              onClick={handleEnablePush}
              className="focus-ring hidden items-center gap-1.5 rounded-lg border border-accent-600 px-2.5 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-50 sm:flex"
            >
              <BellRing size={13} /> Enable alerts
            </button>
          )
        )}

        <button
          onClick={() => navigate('/notifications')}
          className="focus-ring relative rounded-lg p-2 text-ink-700 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700">
              {currentUser?.name?.[0] ?? '?'}
            </div>
            <span className="hidden text-sm font-medium text-ink-900 sm:block">{currentUser?.name}</span>
            <ChevronDown size={14} className="text-ink-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-black/5">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/profile')
                }}
                className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-gray-50"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}