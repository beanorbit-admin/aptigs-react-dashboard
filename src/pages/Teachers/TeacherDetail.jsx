import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchTeachersThunk, resetTeacherPasswordThunk } from '../../store/slices/teacherSlice'

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function genPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function TeacherDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const teacher = useAppSelector(state => state.teachers.list.find(t => t.id === Number(id)))

  const [pwModal, setPwModal] = useState(false)
  const [newPw, setNewPw] = useState('')

  useEffect(() => {
    dispatch(fetchTeachersThunk())
  }, [dispatch])

  if (!teacher) return (
    <PageWrapper title="Teacher Detail">
      <p className="text-gray-500">Teacher not found.</p>
    </PageWrapper>
  )

  const resetPassword = async () => {
    const result = await dispatch(resetTeacherPasswordThunk(teacher.id))
    if (result.meta.requestStatus === 'fulfilled') {
      setNewPw(result.payload?.tempPassword || genPassword())
      setPwModal(true)
    } else {
      toast.error('Reset failed')
    }
  }

  return (
    <PageWrapper title="Teacher Detail">
      <button onClick={() => navigate('/teachers')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Teachers
      </button>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
          {getInitials(teacher.name)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{teacher.name}</h2>
          <p className="text-sm text-gray-500">{teacher.email}</p>
          <p className="text-sm text-gray-500">{teacher.country_code || '+91'} {teacher.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={teacher.status === 'Active' ? 'success' : 'default'}>{teacher.status}</Badge>
          <Button variant="secondary" size="sm" onClick={resetPassword}>
            <RefreshCw className="h-4 w-4" /> Reset Password
          </Button>
        </div>
      </div>


      {/* Reset Password Modal */}
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="New Password" size="sm">
        <p className="text-sm text-gray-600 mb-3">Share this temporary password with the teacher:</p>
        <div className="flex items-center gap-2 mb-4">
          <input readOnly value={newPw} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={() => { navigator.clipboard.writeText(newPw); toast.success('Copied!') }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setPwModal(false)}>Done</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
