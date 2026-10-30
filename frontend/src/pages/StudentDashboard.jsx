import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, AlertCircle, ClipboardList, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { Skeleton, StatCardSkeleton, DonutSkeleton, ListSkeleton, GreetingCardSkeleton } from '../components/Skeleton.jsx'
import { useApp, studentCompletion, studentOverallStatus, formatDateTime } from '../context/AppContext.jsx'

const PIE_COLORS = { Submitted: '#16A34A', Pending: '#D97706', Missing: '#DC2626' }

export default function StudentDashboard() {
  const { currentUser, students, dataLoaded } = useApp()
  const navigate = useNavigate()

  // True only until the first fetch finishes, so live updates don't flash skeletons.
  const isLoading = !dataLoaded
  const student = students.find((s) => s.id === currentUser?.student_id)

  // Only show the "not linked" message once the data has actually loaded.
  if (!isLoading && !student) {
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

  const requirements = student?.requirements ?? []
  const activity = student?.activity ?? []

  // Apply the exact same filter used in StudentDetails.jsx
  const visibleRequirements = requirements.filter(
    (r) => r.active === 1 || r.active === true || r.status !== 'Missing'
  )

  const submitted = visibleRequirements.filter((r) => r.status === 'Submitted').length
  const pending = visibleRequirements.filter((r) => r.status === 'Pending').length
  const missing = visibleRequirements.filter((r) => r.status === 'Missing').length
  const pieData = [
    { name: 'Submitted', value: submitted },
    { name: 'Pending', value: pending },
    { name: 'Missing', value: missing },
  ].filter((d) => d.value > 0)

  return (
    <Layout title="My Dashboard">
      {/* Welcome banner + stat cards need the student record, so they get their own placeholders */}
      {isLoading ? (
        <>
          <GreetingCardSkeleton />
          <div className="mb-6 h-[104px] animate-pulse rounded-2xl bg-gray-200 motion-reduce:animate-none" aria-hidden="true" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Requirement breakdown</h3>
          {isLoading ? (
            <>
              <DonutSkeleton height={220} size={160} thickness={30} />
              <div className="mt-2 flex justify-center">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-9 w-full rounded-lg" />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Recent activity</h3>
          {isLoading ? (
            <ListSkeleton rows={6} />
          ) : (
            <ul className="divide-y divide-ink-300/60">
              {activity.slice(0, 6).map((a, i) => (
                <li key={i} className="py-2.5 text-sm">
                  <p className="text-ink-700">{a.text}</p>
                  <p className="text-xs text-ink-500">{formatDateTime(a.created_at || a.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}