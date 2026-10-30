import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users2, CheckCircle2, Clock, AlertCircle, UserPlus, ClipboardList, FileBarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import { BarChartSkeleton, DonutSkeleton, ListSkeleton } from '../components/Skeleton.jsx'
import { useApp, studentOverallStatus, formatDateTime } from '../context/AppContext.jsx'

const PIE_COLORS = ['#16A34A', '#D97706', '#DC2626']

export default function Dashboard() {
  const { students, notifications, dataLoaded } = useApp()
  const navigate = useNavigate()

  // True only until the first fetch finishes, so live updates don't flash skeletons.
  const isLoading = !dataLoaded

  const stats = useMemo(() => {
    let complete = 0, pending = 0, missing = 0
    students.forEach((s) => {
      const status = studentOverallStatus(s)
      if (status === 'Complete') complete += 1
      else if (status === 'Pending') pending += 1
      else missing += 1
    })
    return { total: students.length, complete, pending, missing }
  }, [students])

  const bySection = useMemo(() => {
    const map = {}
    students.forEach((s) => {
      if (!map[s.section]) map[s.section] = { section: s.section, Submitted: 0, Pending: 0, Missing: 0 }
      s.requirements.forEach((r) => {
        map[s.section][r.status] += 1
      })
    })
    return Object.values(map)
  }, [students])

  const pieData = [
    { name: 'Complete', value: stats.complete },
    { name: 'Pending', value: stats.pending },
    { name: 'Incomplete', value: stats.missing },
  ]

  const recentActivity = useMemo(() => {
    return students
      .flatMap((s) => s.activity.map((a) => ({ ...a, student: s.name })))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 6)
  }, [students])

  const recentNotifications = notifications.slice(0, 5)

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.total} icon={Users2} tone="accent" />
        <StatCard label="Complete Requirements" value={stats.complete} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pending Requirements" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Missing Requirements" value={stats.missing} icon={AlertCircle} tone="rose" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Requirement status by section</h3>
          {isLoading ? (
            <BarChartSkeleton height={280} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bySection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                <XAxis dataKey="section" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Submitted" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#D97706" />
                <Bar dataKey="Missing" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Overall compliance</h3>
          {isLoading ? (
            <DonutSkeleton height={280} size={170} thickness={30} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Recent student activity</h3>
          {isLoading ? (
            <ListSkeleton rows={6} trailing />
          ) : (
            <ul className="divide-y divide-ink-300/60">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{a.student}</p>
                    <p className="text-ink-500">{a.text}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-500">{formatDateTime(a.created_at || a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Recent notifications</h3>
          {isLoading ? (
            <ListSkeleton rows={5} divided={false} />
          ) : (
            <ul className="space-y-3">
              {recentNotifications.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={`font-medium ${n.read ? 'text-ink-500' : 'text-ink-900'}`}>{n.title}</p>
                  <p className="text-xs text-ink-500">{formatDateTime(n.created_at || n.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => navigate('/students')} className="focus-ring flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700">
          <UserPlus size={16} /> Add student
        </button>
        <button onClick={() => navigate('/requirements')} className="focus-ring flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-gray-50">
          <ClipboardList size={16} /> Manage requirements
        </button>
        <button onClick={() => navigate('/reports')} className="focus-ring flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-gray-50">
          <FileBarChart2 size={16} /> View reports
        </button>
      </div>
    </Layout>
  )
}