import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, ChevronRight, Pencil, Trash2, Plus, FileText } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setCourseContent, addSubject, updateSubject, deleteSubject } from '../../store/slices/courseContentSlice'
import { setCourses } from '../../store/slices/courseSlice'
import { semesters as mockSemesters, subjects as mockSubjects, chapters as mockChapters, lessons as mockLessons } from '../../mock/courseContent'
import { courses as mockCourses } from '../../mock/courses'

export default function SubjectList() {
  const { courseId, semesterId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const courses = useAppSelector(s => s.courses.list)
  const { semesters, subjects, chapters } = useAppSelector(s => s.courseContent)

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

  const course   = courses.find(c => c.id === Number(courseId))
  const semester = semesters.find(s => s.id === Number(semesterId))
  const semSubjects = subjects
    .filter(s => s.semesterId === Number(semesterId))
    .sort((a, b) => a.order - b.order)

  const chapterCount = (subId) => chapters.filter(c => c.subjectId === subId).length

  const openAdd  = () => { setEditTarget(null); reset({ name: '', description: '' }); setModalOpen(true) }
  const openEdit = (sub) => { setEditTarget(sub); reset({ name: sub.name, description: sub.description }); setModalOpen(true) }

  const onSave = (data) => {
    if (editTarget) {
      dispatch(updateSubject({ ...editTarget, ...data }))
      toast.success('Subject updated')
    } else {
      dispatch(addSubject({
        id: Date.now(),
        semesterId: Number(semesterId),
        courseId: Number(courseId),
        name: data.name,
        description: data.description,
        order: semSubjects.length + 1,
      }))
      toast.success('Subject added')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    dispatch(deleteSubject(deleteTarget.id))
    toast.success('Subject deleted')
    setDeleteTarget(null)
  }

  if (!course || !semester) return null

  return (
    <PageWrapper title="Subjects">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <button onClick={() => navigate('/courses')} className="hover:text-gray-700">Courses</button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <button onClick={() => navigate(`/courses/${courseId}/content`)} className="hover:text-gray-700 font-medium text-gray-700">
          {course.title}
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <span className="text-indigo-600 font-medium">{semester.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(`/courses/${courseId}/content`)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{semester.name}</h1>
          </div>
          {semester.description && (
            <p className="text-sm text-gray-500">{semester.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {semSubjects.length} subject{semSubjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Subject
        </Button>
      </div>

      {/* Subjects grid */}
      {semSubjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No subjects yet. Add the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semSubjects.map(sub => (
            <div
              key={sub.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <button
                onClick={() => navigate(`/courses/${courseId}/content/${semesterId}/${sub.id}`)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{sub.name}</p>
                    {sub.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sub.description}</p>
                    )}
                    <p className="text-xs text-purple-600 font-medium mt-2">
                      {chapterCount(sub.id)} chapter{chapterCount(sub.id) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400 transition flex-shrink-0 mt-0.5" />
                </div>
              </button>
              <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-50">
                <button onClick={() => openEdit(sub)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(sub)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Subject' : 'Add Subject'} size="sm">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Subject Name"
            name="name"
            placeholder="e.g. Introduction to Programming"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Brief description of this subject"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editTarget ? 'Update' : 'Add Subject'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Subject" size="sm">
        <p className="text-sm text-gray-600 mb-2">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <p className="text-xs text-gray-400 mb-6">All chapters and lessons inside will also be removed.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
