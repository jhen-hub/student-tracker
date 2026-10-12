import { useMemo, useState } from 'react'
import { Printer, Download, FileBarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Layout from '../components/Layout.jsx'
import SearchBar from '../components/SearchBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp, studentOverallStatus, studentCompletion } from '../context/AppContext.jsx'

export default function Reports() {
  const { students } = useApp()
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('All')
  const [sectionFilter, setSectionFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const yearLevels = ['All', ...new Set(students.map((s) => s.yearLevel).filter(Boolean))]
  const sections = ['All', ...new Set(students.map((s) => s.section).filter(Boolean))]

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
      const matchesYear = yearFilter === 'All' || s.yearLevel === yearFilter
      const matchesSection = sectionFilter === 'All' || s.section === sectionFilter
      const matchesStatus = statusFilter === 'All' || studentOverallStatus(s) === statusFilter
      return matchesSearch && matchesYear && matchesSection && matchesStatus
    })
  }, [students, search, yearFilter, sectionFilter, statusFilter])

  const chartData = useMemo(() => {
    const map = {}
    filtered.forEach((s) => {
      if (!map[s.yearLevel]) map[s.yearLevel] = { yearLevel: s.yearLevel, Complete: 0, Pending: 0, Incomplete: 0 }
      map[s.yearLevel][studentOverallStatus(s)] += 1
    })
    return Object.values(map)
  }, [filtered])

  function handlePrint() {
    window.print()
  }

  function handleExportCSV() {
    const headers = ['Student ID', 'Name', 'Year Level', 'Section', 'Completion %', 'Overall Status']
    const rows = filtered.map((s) => [s.id, s.name, s.yearLevel, s.section, studentCompletion(s), studentOverallStatus(s)])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student-requirements-report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Reports">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search students…" className="w-full sm:w-64" />
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm">
          {yearLevels.map((y) => <option key={y} value={y}>{y === 'All' ? 'All year levels' : y}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm">
          {sections.map((s) => <option key={s} value={s}>{s === 'All' ? 'All sections' : s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm">
          <option value="All">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
          <option value="Incomplete">Incomplete</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={handleExportCSV} className="focus-ring flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={handlePrint} className="focus-ring flex items-center gap-2 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-black/5">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Compliance summary by year level</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
            <XAxis dataKey="yearLevel" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Complete" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pending" fill="#D97706" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Incomplete" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileBarChart2} title="No matching records" message="Adjust your filters to generate a different report." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Year / Section</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-300/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-ink-700">{s.id}</td>
                    <td className="px-4 py-3 text-ink-900">{s.name}</td>
                    <td className="px-4 py-3 text-ink-700">{s.yearLevel} · {s.section}</td>
                    <td className="px-4 py-3 text-ink-700">{studentCompletion(s)}%</td>
                    <td className="px-4 py-3"><StatusBadge status={studentOverallStatus(s)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
