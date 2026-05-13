import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchEnrollmentsThunk, updateEnrollmentThunk, deleteEnrollmentThunk } from '../../store/slices/enrollmentSlice'
import { formatCurrency, formatDate } from '../../utils/formatters'

const statusVariant = { Paid: 'success', Partial: 'warning', Pending: 'danger' }
const PAGE_SIZE = 10

function calcStatus(fee, collected) {
  const n = Number(collected)
  if (n >= Number(fee)) return 'Paid'
  if (n <= 0) return 'Pending'
  return 'Partial'
}

const ACTIVE_FILTER_CONFIGS = [
  { key: 'status', label: 'All Statuses', options: ['Paid', 'Partial', 'Pending'] },
]

export default function EnrollmentsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const enrollments = useAppSelector(state => state.enrollments.list)

  useEffect(() => { dispatch(fetchEnrollmentsThunk()) }, [dispatch])

  const [tab, setTab] = useState('pending')

  // Pending requests state
  const [pendingQuery, setPendingQuery] = useState({ search: '', filters: {}, page: 1 })
  const [approveTarget, setApproveTarget] = useState(null)
  const [approveForm, setApproveForm] = useState({ collectedAmount: '', paymentDate: '' })
  const [rejectTarget, setRejectTarget] = useState(null)

  // Active enrollments state
  const [activeQuery, setActiveQuery] = useState({ search: '', filters: {}, page: 1 })
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ collectedAmount: '', paymentDate: '' })

  // --- Pending requests ---
  const pendingEnrollments = useMemo(
    () => enrollments.filter(e => e.access_status === 'pending_approval'),
    [enrollments]
  )

  const { rows: pendingRows, total: pendingTotal } = useMemo(() => {
    const s = (pendingQuery.search || '').toLowerCase()
    const filtered = s
      ? pendingEnrollments.filter(e => (e.student_name || '').toLowerCase().includes(s))
      : pendingEnrollments
    return {
      rows: filtered.slice((pendingQuery.page - 1) * PAGE_SIZE, pendingQuery.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [pendingEnrollments, pendingQuery])

  const handlePendingQuery = useCallback((q) => setPendingQuery(q), [])

  const openApprove = (e) => {
    setApproveTarget(e)
    setApproveForm({ collectedAmount: '', paymentDate: '' })
  }

  const onApprove = async () => {
    const result = await dispatch(updateEnrollmentThunk({
      id: approveTarget.id,
      data: {
        access_status: 'granted',
        enrollment_type: 'direct',
        collected_amount: Number(approveForm.collectedAmount) || 0,
        payment_date: approveForm.paymentDate || null,
      },
    }))
    if (result.meta.requestStatus === 'fulfilled') toast.success(`${approveTarget.student_name} approved and access granted`)
    else toast.error('Approval failed')
    setApproveTarget(null)
  }

  const onReject = async () => {
    const result = await dispatch(deleteEnrollmentThunk(rejectTarget.id))
    if (result.meta.requestStatus === 'fulfilled') toast.success(`Enrollment request for ${rejectTarget.student_name} rejected`)
    else toast.error('Rejection failed')
    setRejectTarget(null)
  }

  const pendingColumns = [
    {
      header: 'Student',
      cell: e => (
        <button onClick={() => navigate(`/students/${e.student}`)} className="text-indigo-600 hover:underline font-medium text-sm">
          {e.student_name}
        </button>
      ),
    },
    { header: 'Course', accessor: 'course_title' },
    { header: 'Course Fee', cell: e => formatCurrency(e.course_fee) },
    { header: 'Applied On', cell: e => formatDate(e.created_at) },
    {
      header: 'Actions',
      cell: e => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openApprove(e)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
            title="Approve"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => setRejectTarget(e)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
            title="Reject"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      ),
    },
  ]

  // --- Active enrollments ---
  const activeEnrollments = useMemo(
    () => enrollments.filter(e => e.access_status === 'granted'),
    [enrollments]
  )

  const { rows: activeRows, total: activeTotal } = useMemo(() => {
    const s = (activeQuery.search || '').toLowerCase()
    const { status = 'All' } = activeQuery.filters || {}
    const filtered = activeEnrollments.filter(e => {
      if (s && !(e.student_name || '').toLowerCase().includes(s)) return false
      if (status !== 'All' && e.status !== status) return false
      return true
    })
    return {
      rows: filtered.slice((activeQuery.page - 1) * PAGE_SIZE, activeQuery.page * PAGE_SIZE),
      total: filtered.length,
    }
  }, [activeEnrollments, activeQuery])

  const handleActiveQuery = useCallback((q) => setActiveQuery(q), [])

  const openEdit = (e) => {
    setEditTarget(e)
    setEditForm({ collectedAmount: e.collected_amount, paymentDate: e.payment_date || '' })
  }

  const onSaveEdit = async () => {
    const result = await dispatch(updateEnrollmentThunk({
      id: editTarget.id,
      data: {
        collected_amount: Number(editForm.collectedAmount),
        payment_date: editForm.paymentDate || null,
      },
    }))
    if (result.meta.requestStatus === 'fulfilled') toast.success('Payment details updated')
    else toast.error('Update failed')
    setEditTarget(null)
  }

  const activeColumns = [
    {
      header: 'Student',
      cell: e => (
        <button onClick={() => navigate(`/students/${e.student}`)} className="text-indigo-600 hover:underline font-medium text-sm">
          {e.student_name}
        </button>
      ),
    },
    { header: 'Course', accessor: 'course_title' },
    { header: 'Course Fee', cell: e => formatCurrency(e.course_fee) },
    { header: 'Collected', cell: e => formatCurrency(e.collected_amount) },
    { header: 'Balance', cell: e => formatCurrency(e.course_fee - e.collected_amount) },
    { header: 'Payment Date', cell: e => formatDate(e.payment_date) },
    {
      header: 'Payment Status',
      cell: e => <Badge variant={statusVariant[e.status]}>{e.status}</Badge>,
    },
    {
      header: 'Action',
      cell: e => (
        <button onClick={() => openEdit(e)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit payment">
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <PageWrapper title="Enrollments">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'pending'
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Pending Requests
          {pendingEnrollments.length > 0 && (
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-xs font-semibold ${
              tab === 'pending' ? 'bg-white text-indigo-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {pendingEnrollments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'active'
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Active Enrollments
          <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-xs font-semibold ${
            tab === 'active' ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {activeEnrollments.length}
          </span>
        </button>
      </div>

      {/* Pending Requests Tab */}
      {tab === 'pending' && (
        <>
          {pendingEnrollments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              <p className="text-sm">No pending enrollment requests</p>
            </div>
          ) : (
            <DataTable
              columns={pendingColumns}
              data={pendingRows}
              total={pendingTotal}
              searchPlaceholder="Search by student name..."
              pageSize={PAGE_SIZE}
              onQueryChange={handlePendingQuery}
            />
          )}
        </>
      )}

      {/* Active Enrollments Tab */}
      {tab === 'active' && (
        <DataTable
          columns={activeColumns}
          data={activeRows}
          total={activeTotal}
          searchPlaceholder="Search by student name..."
          filterConfigs={ACTIVE_FILTER_CONFIGS}
          pageSize={PAGE_SIZE}
          onQueryChange={handleActiveQuery}
        />
      )}

      {/* Approve Modal */}
      <Modal isOpen={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Enrollment">
        {approveTarget && (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg px-4 py-3 space-y-1">
              <p className="text-sm font-medium text-indigo-900">{approveTarget.student_name}</p>
              <p className="text-sm text-indigo-700">{approveTarget.course_title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Course Fee</label>
              <input
                readOnly
                value={formatCurrency(approveTarget.course_fee)}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Amount Collected (₹)</label>
              <input
                type="number"
                min="0"
                max={approveTarget.course_fee}
                placeholder="0"
                value={approveForm.collectedAmount}
                onChange={e => setApproveForm(f => ({ ...f, collectedAmount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Leave 0 if no payment has been collected yet</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment Date</label>
              <input
                type="date"
                value={approveForm.paymentDate}
                onChange={e => setApproveForm(f => ({ ...f, paymentDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between text-sm text-gray-600">
              <span>Payment status after approval:</span>
              <Badge variant={statusVariant[calcStatus(approveTarget.course_fee, approveForm.collectedAmount)]}>
                {calcStatus(approveTarget.course_fee, approveForm.collectedAmount)}
              </Badge>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setApproveTarget(null)}>Cancel</Button>
              <Button onClick={onApprove}>
                <Check className="h-4 w-4" /> Approve & Grant Access
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirm Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Request" size="sm">
        <p className="text-sm text-gray-600 mb-2">
          Reject enrollment request for <strong>{rejectTarget?.student_name}</strong>?
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Course: {rejectTarget?.course_title}. This request will be removed permanently.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={onReject}>Reject Request</Button>
        </div>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Payment Details" size="sm">
        {editTarget && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Course Fee</label>
              <input readOnly value={formatCurrency(editTarget.course_fee)} className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Collected Amount (₹)</label>
              <input
                type="number"
                min="0"
                max={editTarget.course_fee}
                value={editForm.collectedAmount}
                onChange={e => setEditForm(f => ({ ...f, collectedAmount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment Date</label>
              <input
                type="date"
                value={editForm.paymentDate}
                onChange={e => setEditForm(f => ({ ...f, paymentDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between text-sm text-gray-600">
              <span>Auto status:</span>
              <Badge variant={statusVariant[calcStatus(editTarget.course_fee, editForm.collectedAmount)]}>
                {calcStatus(editTarget.course_fee, editForm.collectedAmount)}
              </Badge>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={onSaveEdit}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
