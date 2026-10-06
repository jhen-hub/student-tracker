import { ClipboardList } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RequirementChecklist from '../components/RequirementChecklist.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp, studentCompletion, studentOverallStatus } from '../context/AppContext.jsx'

export default function StudentRequirements() {
  const { currentUser, students } = useApp()
  const student = students.find((s) => s.id === currentUser?.studentId)

  if (!student) {
    return (
      <Layout title="My Requirements">
        <EmptyState
          icon={ClipboardList}
          title="No student record linked"
          message="Your account isn't linked to a student record yet. Ask the registrar to link your account to see your requirements."
        />
      </Layout>
    )
  }

  return (
    <Layout title="My Requirements">
      <div className="mb-5 rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-500">{student.id} · {student.yearLevel} · {student.section}</p>
            <h2 className="font-display text-lg font-semibold text-ink-900">{student.name}</h2>
          </div>
          <StatusBadge status={studentOverallStatus(student)} />
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-900">Overall completion</span>
            <span className="text-ink-500">{studentCompletion(student)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-accent-500" style={{ width: `${studentCompletion(student)}%` }} />
          </div>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-ink-900">Checklist</h3>
      <RequirementChecklist requirements={student.requirements} readOnly />
      <p className="mt-3 text-xs text-ink-500">
        Requirement statuses are updated by registrar staff once your documents are received and verified.
      </p>
    </Layout>
  )
}
