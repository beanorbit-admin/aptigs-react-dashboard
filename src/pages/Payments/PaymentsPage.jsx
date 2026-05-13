import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { useAppSelector } from '../../hooks/redux'
import { formatCurrency, formatDate } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }
const PAGE_SIZE = 10

export default function PaymentsPage() {
  const navigate = useNavigate()
  const enrollments = useAppSelector(state => state.enrollments.list)
  const courses = useAppSelector(state => state.courses.list)

  const [statusFilter, setStatusFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = enrollments.filter(e => {
    if (statusFilter !== 'All' && e.status !== statusFilter) return false
    if (courseFilter !== 'All' && e.course_title !== courseFilter) return false
    if (fromDate && e.payment_date && e.payment_date < fromDate) return false
    if (toDate && e.payment_date && e.payment_date > toDate) return false
    if (search && !(e.student_name || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalFee = filtered.reduce((s, e) => s + (e.course_fee || 0), 0)
  const totalCollected = filtered.reduce((s, e) => s + (e.collected_amount || 0), 0)
  const totalBalance = totalFee - totalCollected

  const exportCSV = () => {
    const headers = ['Student', 'Course', 'Fee', 'Collected', 'Balance', 'Payment Date', 'Status']
    const rows = filtered.map(e => [
      e.student_name, e.course_title, e.course_fee, e.collected_amount,
      e.course_fee - e.collected_amount, e.payment_date || '', e.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payments.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueCourses = [...new Set(enrollments.map(e => e.course_title).filter(Boolean))]

  const columns = [
    { header: 'Student', cell: e => <span className="font-medium text-gray-900">{e.student_name}</span> },
    { header: 'Course', accessor: 'course_title' },
    { header: 'Fee', cell: e => formatCurrency(e.course_fee) },
    { header: 'Collected', cell: e => formatCurrency(e.collected_amount) },
    { header: 'Balance', cell: e => formatCurrency(e.course_fee - e.collected_amount) },
    { header: 'Payment Date', cell: e => formatDate(e.payment_date) },
    { header: 'Status', cell: e => <Badge variant={statusVariant[e.status]}>{e.status}</Badge> },
    {
      header: 'Action',
      cell: () => (
        <button onClick={() => navigate('/enrollments')} className="text-xs text-indigo-600 hover:underline">
          View Enrollment
        </button>
      ),
    },
  ]

  return (
    <PageWrapper title="Payment Management">
      {/* Custom filter toolbar (date range + multi-select cannot fit DataTable's FilterConfig) */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {['All', 'Paid', 'Partial', 'Pending'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="All">All Courses</option>
          {uniqueCourses.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <input placeholder="Search student..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44" />
        <div className="ml-auto">
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Total Fee', value: formatCurrency(totalFee) },
          { label: 'Total Collected', value: formatCurrency(totalCollected) },
          { label: 'Total Balance', value: formatCurrency(totalBalance) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm px-6 py-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <Table columns={columns} data={paginated} />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </PageWrapper>
  )
}
