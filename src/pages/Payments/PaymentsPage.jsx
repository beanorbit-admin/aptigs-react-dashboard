import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import SearchInput from '../../components/common/SearchInput'
import SkeletonRow from '../../components/common/SkeletonRow'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'
import { useApiQuery } from '../../hooks/useApiQuery'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }
const PAGE_SIZE = 10

export default function PaymentsPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const courses = useAppSelector(state => state.courses.list)

  const [statusFilter, setStatusFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { dispatch(fetchCoursesThunk()) }, [dispatch])

  const { data, loading } = useApiQuery(
    (signal) => api.get('enrollments/', {
      params: {
        access_status: 'granted',
        search: search || undefined,
        page,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        course_title: courseFilter !== 'All' ? courseFilter : undefined,
        payment_date_after: fromDate || undefined,
        payment_date_before: toDate || undefined,
      },
      signal,
    }).then(r => r.data),
    [search, page, statusFilter, courseFilter, fromDate, toDate]
  )

  const paginated = data?.results ?? []
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE)

  // Summary totals reflect the current page only (pagination trade-off)
  const totalFee = paginated.reduce((s, e) => s + (e.course_fee || 0), 0)
  const totalCollected = paginated.reduce((s, e) => s + (e.collected_amount || 0), 0)
  const totalBalance = totalFee - totalCollected

  const exportCSV = () => {
    const headers = ['Student', 'Course', 'Fee', 'Collected', 'Balance', 'Payment Date', 'Status']
    const rows = paginated.map(e => [
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

  const uniqueCourses = [...new Set(courses.map(c => c.title).filter(Boolean))]

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
      {/* Custom filter toolbar */}
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
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder="Search student..."
        />
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

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <SkeletonRow cols={columns.length} rows={PAGE_SIZE} />
            </tbody>
          </table>
        </div>
      ) : (
        <Table columns={columns} data={paginated} />
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </PageWrapper>
  )
}
