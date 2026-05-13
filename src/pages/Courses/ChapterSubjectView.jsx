import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, BookOpen, ChevronRight, Pencil, Trash2, Plus, Video, Search } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchSemestersThunk, fetchSubjectsThunk,
  fetchChaptersThunk, fetchLessonsThunk,
  createChapterThunk, updateChapterThunk, deleteChapterThunk,
} from '../../store/slices/courseContentSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'

export default function ChapterSubjectView() {
  const { courseId, semesterId, subjectId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const courses = useAppSelector(s => s.courses.list)
  const { semesters, subjects, chapters, lessons } = useAppSelector(s => s.courseContent)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    dispatch(fetchCoursesThunk())
    dispatch(fetchSemestersThunk({ course: courseId }))
    dispatch(fetchSubjectsThunk({ semester: semesterId }))
    dispatch(fetchChaptersThunk({ subject: subjectId }))
    dispatch(fetchLessonsThunk({ chapter__subject: subjectId }))
  }, [dispatch, courseId, semesterId, subjectId])

  const course   = courses.find(c => c.id === Number(courseId))
  const semester = semesters.find(s => s.id === Number(semesterId))
  const subject  = subjects.find(s => s.id === Number(subjectId))

  const subjectChapters = chapters
    .filter(c => c.subject === Number(subjectId))
    .sort((a, b) => a.order - b.order)

  const visibleChapters = useMemo(() => {
    const s = search.toLowerCase()
    return subjectChapters.filter(ch =>
      !s || ch.name.toLowerCase().includes(s) || (ch.description || '').toLowerCase().includes(s)
    )
  }, [subjectChapters, search])

  const lessonCount = (chId) => lessons.filter(l => l.chapter === chId).length

  const openAdd  = () => { setEditTarget(null); reset({ name: '', description: '' }); setModalOpen(true) }
  const openEdit = (ch) => { setEditTarget(ch); reset({ name: ch.name, description: ch.description }); setModalOpen(true) }

  const onSave = async (data) => {
    let result
    if (editTarget) {
      result = await dispatch(updateChapterThunk({ id: editTarget.id, data: { name: data.name, description: data.description } }))
    } else {
      result = await dispatch(createChapterThunk({
        subject: Number(subjectId),
        semester: Number(semesterId),
        course: Number(courseId),
        name: data.name,
        description: data.description,
        order: subjectChapters.length + 1,
      }))
    }
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editTarget ? 'Chapter updated' : 'Chapter added')
      setModalOpen(false)
    } else {
      toast.error('Save failed')
    }
  }

  const confirmDelete = async () => {
    const result = await dispatch(deleteChapterThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Chapter deleted')
    } else {
      toast.error('Delete failed')
    }
    setDeleteTarget(null)
  }

  if (!course || !semester || !subject) return null

  return (
    <PageWrapper title="Chapters">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <button onClick={() => navigate('/courses')} className="hover:text-gray-700">Courses</button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <button onClick={() => navigate(`/courses/${courseId}/content`)} className="hover:text-gray-700 font-medium text-gray-700">
          {course.title}
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <button onClick={() => navigate(`/courses/${courseId}/content/${semesterId}`)} className="hover:text-gray-700 font-medium text-gray-700">
          {semester.name}
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <span className="text-indigo-600 font-medium">{subject.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(`/courses/${courseId}/content/${semesterId}`)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{subject.name}</h1>
          </div>
          {subject.description && (
            <p className="text-sm text-gray-500">{subject.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {subjectChapters.length} chapter{subjectChapters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Chapter
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search chapters..."
          className="w-full sm:w-72 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Chapter grid */}
      {subjectChapters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Video className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No chapters yet. Add the first one.</p>
        </div>
      ) : visibleChapters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-sm text-gray-400">No chapters match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleChapters.map(ch => (
            <div
              key={ch.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              <button
                onClick={() => navigate(`/courses/${courseId}/content/${semesterId}/${subjectId}/${ch.id}`)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{ch.name}</p>
                    {ch.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ch.description}</p>
                    )}
                    <p className="text-xs text-indigo-600 font-medium mt-2">
                      {lessonCount(ch.id)} lesson{lessonCount(ch.id) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition flex-shrink-0 mt-0.5" />
                </div>
              </button>
              <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-50">
                <button onClick={() => openEdit(ch)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(ch)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Chapter' : 'Add Chapter'} size="sm">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Chapter Name"
            name="name"
            placeholder="e.g. Introduction to C"
            error={errors.name?.message}
            register={n => register(n, { required: 'Name is required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Brief overview of this chapter"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editTarget ? 'Update' : 'Add Chapter'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Chapter" size="sm">
        <p className="text-sm text-gray-600 mb-2">Delete <strong>{deleteTarget?.name}</strong>?</p>
        <p className="text-xs text-gray-400 mb-6">All lessons inside will also be removed.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
