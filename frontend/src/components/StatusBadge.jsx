const STYLES = {
  Submitted: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Complete: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Missing: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Incomplete: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Inactive: 'bg-ink-100 text-ink-500 ring-1 ring-ink-300 bg-gray-100',
  Read: 'bg-ink-100 text-ink-500 ring-1 ring-ink-300 bg-gray-100',
  Unread: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}
