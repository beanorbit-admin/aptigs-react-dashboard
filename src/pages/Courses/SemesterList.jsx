import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, BookOpen, ChevronRight, Pencil, Trash2, Plus, Layers } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setCourseContent, addSemester, updateSemester, deleteSemester } from '../../store/slices/courseContentSlice'
import { setCourses } from '../../store/slices/courseSlice'
import { semesters as mockSemesters, subjects as mockSubjects, chapters as mockChapters, lessons as mockLessons } from '../../mock/courseContent'
import { courses as mockCourses } from '../../mock/courses'

export default function SemesterList() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const courses = useAppSelector(s => s.courses.list)
  const { semesters, subjects } = useAppSelector(s => s.courseContent)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (courses.length === 0) dispatch(setCourses(mockCourses))
    if (semesters.length === 0) {
      dispatch(setCourseContent({ semesters: mockSemesters, subjects: mockSubjects, chapters: mockChapters, lessons: mockLessons }))
    }
  }, [courses.length, semesters.length, dispatch])

  const course = courses.find(c => c.id === Number(courseId))
  const courseSemesters = semesters
    .filter(s => s.courseId === Number(courseId))
    .sort((a, b) => a.order - b.order)

  const subjectCount = (semId) => subjects.filter(s => s.semesterId === semId).length

  const openAdd = () => { setEditTarget(null); reset({ name: '', description: '' }); setModalOpen(true) }
  const openEdit = (sem) => { setEditTarget(sem); reset({ name: sem.name, description: sem.description }); setModalOpen(true) }

  const onSave = (data) => {
    if (editTarget) {
      dispatch(updateSemester({ ...editTarget, ...data }))
      toast.success('Semester updated')
    } else {
      dispatch(addSemester({
        id: Date.now(),
        courseId: Number(courseId),
        name: data.name,
        description: data.description,
        order: courseSemesters.length + 1,
      }))
      toast.success('Semester added')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    dispatch(deleteSemester(deleteTarget.id))
    toast.success('Semester deleted')
    setDeleteTarget(null)
  }

  if (!course) return null

  return (
    <PageWrapper title="Course Content">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/courses')} className="hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Courses
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-800">{course.title}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-indigo-600 font-medium">Semesters</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{courseSemesters.length} semester{courseSemesters.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Semester
        </Button>
      </div>

      {/* Semester grid */}
      {courseSemesters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No semesters yet. Add the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseSemesters.map(sem => (
            <div
              key={sem.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <button
                onClick={() => navigate(`/courses/${courseId}/content/${sem.id}`)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{sem.name}</p>
                    {sem.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sem.description}</p>
                    )}
                    <p className="text-xs text-indigo-600 font-medium mt-2">
                      {subjectCount(sem.id)} subject{subjectCount(sem.id) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition flex-shrink-0 mt-0.5" />
                </div>
              </button>
              <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-50">
                <button onClick={() => openEdit(sem)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(sem)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Semester' : 'Add Semester'} size="sm">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Semester Name"
            name="name"
            placeholder="e.g. Semester 1"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Brief description of this semester"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editTarget ? 'Update' : 'Add Semester'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Semester" size="sm">
        <p className="text-sm text-gray-600 mb-2">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <p className="text-xs text-gray-400 mb-6">All subjects, chapters and lessons inside will also be removed.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
