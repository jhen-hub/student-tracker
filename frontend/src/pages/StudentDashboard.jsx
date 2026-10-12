import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, AlertCircle, ClipboardList, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp, studentCompletion, studentOverallStatus } from '../context/AppContext.jsx'

const PIE_COLORS = { Submitted: '#16A34A', Pending: '#D97706', Missing: '#DC2626' }

export default function StudentDashboard() {
  const { currentUser, students, notifications } = useApp()
  const navigate = useNavigate()
  const student = students.find((s) => s.id === currentUser?.student_id)

  if (!student) {
    return (
      <Layout title="My Dashboard">
        <EmptyState
          icon={ClipboardList}
          title="No student record linked"
          message="Your account isn't linked to a student record yet. Ask the registrar to link your account to see your requirements."
        />
      </Layout>
    )
  }

  const submitted = student.requirements.filter((r) => r.status === 'Submitted').length
  const pending = student.requirements.filter((r) => r.status === 'Pending').length
  const missing = student.requirements.filter((r) => r.status === 'Missing').length
  const pieData = [
    { name: 'Submitted', value: submitted },
    { name: 'Pending', value: pending },
    { name: 'Missing', value: missing },
  ].filter((d) => d.value > 0)

  const myNotifications = notifications.slice(0, 4)

  return (
    <Layout title="My Dashboard">
      <div className="mb-6 rounded-2xl bg-navy-900 p-6 text-white">
        <p className="text-sm text-white/60">Welcome back,</p>
        <h2 className="font-display text-xl font-semibold">{student.name}</h2>
        <p className="mt-1 text-sm text-white/70">{student.id} · {student.yearLevel} · {student.section}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completion" value={`${studentCompletion(student)}%`} icon={ClipboardList} tone="accent" />
        <StatCard label="Submitted" value={submitted} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" />
        <StatCard label="Missing" value={missing} icon={AlertCircle} tone="rose" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Requirement breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center">
            <StatusBadge status={studentOverallStatus(student)} />
          </div>
          <button
            onClick={() => navigate('/student/requirements')}
            className="focus-ring mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent-600 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
          >
            View full checklist <ArrowRight size={14} />
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Recent activity</h3>
          <ul className="divide-y divide-ink-300/60">
            {student.activity.slice(0, 6).map((a, i) => (
              <li key={i} className="py-2.5 text-sm">
                <p className="text-ink-700">{a.text}</p>
                <p className="text-xs text-ink-500">{a.date}</p>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </Layout>
  )
}
