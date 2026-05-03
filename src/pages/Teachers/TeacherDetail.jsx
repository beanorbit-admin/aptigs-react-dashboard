import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Copy, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { updateTeacher } from '../../store/slices/teacherSlice'

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
  const courses = useAppSelector(state => state.courses.list)

  const [pwModal, setPwModal] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [addCourseId, setAddCourseId] = useState('')

  if (!teacher) return (
    <PageWrapper title="Teacher Detail">
      <p className="text-gray-500">Teacher not found.</p>
    </PageWrapper>
  )

  const assignedCourses = courses.filter(c => (teacher.courseIds || []).includes(c.id))
  const unassigned = courses.filter(c => !(teacher.courseIds || []).includes(c.id))

  const removeCourse = (cid) => {
    dispatch(updateTeacher({ ...teacher, courseIds: teacher.courseIds.filter(id => id !== cid) }))
    toast.success('Course removed')
  }

  const addCourse = () => {
    if (!addCourseId) return
    dispatch(updateTeacher({ ...teacher, courseIds: [...(teacher.courseIds || []), Number(addCourseId)] }))
    setAddCourseId('')
    toast.success('Course added')
  }

  const resetPassword = () => {
    const pw = genPassword()
    setNewPw(pw)
    setPwModal(true)
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
          <p className="text-sm text-gray-500">{teacher.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={teacher.status === 'Active' ? 'success' : 'default'}>{teacher.status}</Badge>
          <Button variant="secondary" size="sm" onClick={resetPassword}>
            <RefreshCw className="h-4 w-4" /> Reset Password
          </Button>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Courses</h3>
        {assignedCourses.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No courses assigned</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {assignedCourses.map(c => (
              <li key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">{c.title}</span>
                  <span className="text-xs text-gray-500 ml-2">{c.category}</span>
                </div>
                <button onClick={() => removeCourse(c.id)} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {unassigned.length > 0 && (
          <div className="flex items-center gap-3">
            <select value={addCourseId} onChange={e => setAddCourseId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Add a course...</option>
              {unassigned.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Button size="sm" onClick={addCourse} disabled={!addCourseId}>Add</Button>
          </div>
        )}
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
