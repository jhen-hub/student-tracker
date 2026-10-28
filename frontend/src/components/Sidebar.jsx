import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users2,
  ClipboardList,
  FileBarChart2,
  Bell,
  UserCircle,
  ShieldCheck,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import logo from '../assets/logo.svg'

// Each role sees its own nav sections — Admin and Staff share registrar tools
// (with feature-level differences enforced inside each page), while Student
// gets a dedicated personal dashboard/requirements/profile set instead.
const NAV_SECTIONS = [
  {
    heading: 'Registrar',
    roles: ['Admin', 'Staff'],
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff'] },
      { to: '/students', label: 'Students', icon: Users2, roles: ['Admin', 'Staff'] },
      { to: '/requirements', label: 'Requirements', icon: ClipboardList, roles: ['Admin', 'Staff'] },
      { to: '/reports', label: 'Reports', icon: FileBarChart2, roles: ['Admin', 'Staff'] },
    ],
  },
  {
    heading: 'My Requirements',
    roles: ['Student'],
    items: [
      { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Student'] },
      { to: '/student/requirements', label: 'Requirements', icon: ClipboardList, roles: ['Student'] },
    ],
  },
  {
    heading: 'Account',
    roles: ['Admin', 'Staff', 'Student'],
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['Admin', 'Staff', 'Student'] },
      { to: '/profile', label: 'Edit Profile', icon: UserCircle, roles: ['Admin', 'Staff', 'Student'] },
    ],
  },
  {
    heading: 'Administration',
    roles: ['Admin'],
    items: [
      { to: '/users', label: 'Users', icon: ShieldCheck, roles: ['Admin'] },
      { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['Admin'] },
    ],
  },
]

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { currentUser } = useApp()
  const role = currentUser?.role
  const sections = NAV_SECTIONS.filter((s) => s.roles.includes(role))

  const content = (
    <div className="flex fixed w-64 h-full flex-col bg-navy-900 text-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
          <img src={logo} alt="" className="h-full w-full" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Registrar</p>
          <p className="text-[11px] leading-tight text-white/50">Requirements Tracker</p>
        </div>
        <button onClick={onCloseMobile} className="ml-auto text-white/60 md:hidden">
          <X size={18} />
        </button>
      </div>

      <nav className="mt-2 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {section.heading}
            </p>
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-500 text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/40">
        Signed in as <span className="text-white/70">{role}</span>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 shrink-0 md:block">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-64">{content}</div>
        </div>
      )}
    </>
  )
}
