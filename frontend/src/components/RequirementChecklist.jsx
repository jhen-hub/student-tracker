import StatusBadge from './StatusBadge.jsx'

const STATUSES = ['Submitted', 'Pending', 'Missing']

export default function RequirementChecklist({ requirements, onStatusChange, readOnly = false }) {
  return (
    <ul className="divide-y divide-ink-300/60 rounded-xl border border-ink-300/60 bg-white">
      {requirements.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-medium text-ink-900">{r.name}</span>
          <div className="flex items-center gap-3">
            <StatusBadge status={r.status} />
            {!readOnly && (
              <select
                value={r.status}
                onChange={(e) => onStatusChange(r.requirementId ?? r.id, e.target.value)}
                className="focus-ring rounded-lg border border-ink-300 bg-white px-2 py-1 text-xs text-ink-700"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    Mark as {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
