import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ChevronRight, Pencil, Trash2, Plus,
  PlayCircle, Film, Radio, FileText, Download, ExternalLink, Video,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchSemestersThunk, fetchSubjectsThunk, fetchChaptersThunk,
  fetchLessonsThunk, createLessonThunk, updateLessonThunk, deleteLessonThunk,
} from '../../store/slices/courseContentSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'
import CardSkeleton from '../../components/common/CardSkeleton'

const VIDEO_TYPE_LABELS   = { youtube: 'YouTube', streaming: 'Streaming', m3u8: 'M3U8' }
const VIDEO_TYPE_VARIANTS = { youtube: 'danger', streaming: 'info', m3u8: 'purple' }

function LessonIcon({ lesson }) {
  if (lesson.type === 'pdf') return <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
  if (lesson.video_type === 'youtube') return <PlayCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
  if (lesson.video_type === 'streaming') return <Radio className="h-4 w-4 text-blue-500 flex-shrink-0" />
  return <Film className="h-4 w-4 text-purple-500 flex-shrink-0" />
}

function LessonBadge({ lesson }) {
  if (lesson.type === 'video') {
    return <Badge variant={VIDEO_TYPE_VARIANTS[lesson.video_type]}>{VIDEO_TYPE_LABELS[lesson.video_type]}</Badge>
  }
  if (lesson.is_downloadable) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <Download className="h-3 w-3" /> Downloadable
      </span>
    )
  }
  return <span className="text-xs text-gray-400">View only</span>
}

export default function ChapterView() {
  const { courseId, semesterId, subjectId, chapterId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const courses = useAppSelector(s => s.courses.list)
  const { semesters, subjects, chapters, lessons, loading: contentLoading } = useAppSelector(s => s.courseContent)

  const [lessonModal, setLessonModal] = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [lessonType, setLessonType] = useState('video')
  const [videoType, setVideoType] = useState('youtube')

  const lessonForm = useForm()

  useEffect(() => {
    dispatch(fetchCoursesThunk())
    dispatch(fetchSemestersThunk({ course: courseId }))
    dispatch(fetchSubjectsThunk({ semester: semesterId }))
    dispatch(fetchChaptersThunk({ subject: subjectId }))
    dispatch(fetchLessonsThunk({ chapter: chapterId }))
  }, [dispatch, courseId, semesterId, subjectId, chapterId])

  const course   = courses.find(c => c.id === Number(courseId))
  const semester = semesters.find(s => s.id === Number(semesterId))
  const subject  = subjects.find(s => s.id === Number(subjectId))
  const chapter  = chapters.find(c => c.id === Number(chapterId))

  const chLessons = lessons
    .filter(l => l.chapter === Number(chapterId))
    .sort((a, b) => a.order - b.order)

  const openAdd = () => {
    setEditLesson(null)
    setLessonType('video')
    setVideoType('youtube')
    lessonForm.reset({ name: '', video_key: '', video_url: '', streaming_platform: '', streaming_key: '', pdf_url: '', is_downloadable: true })
    setLessonModal(true)
  }

  const openEdit = (lesson) => {
    setEditLesson(lesson)
    setLessonType(lesson.type)
    setVideoType(lesson.video_type || 'youtube')
    lessonForm.reset({
      name: lesson.name,
      video_key: lesson.video_key || '',
      video_url: lesson.video_url || '',
      streaming_platform: lesson.streaming_platform || '',
      streaming_key: lesson.streaming_key || '',
      pdf_url: lesson.pdf_url || '',
      is_downloadable: lesson.is_downloadable ?? true,
    })
    setLessonModal(true)
  }

  const onSave = async (data) => {
    const base = { chapter: Number(chapterId), subject: Number(subjectId), semester: Number(semesterId), course: Number(courseId), name: data.name, type: lessonType, order: chLessons.length + 1 }
    const payload = lessonType === 'pdf'
      ? { ...base, pdf_url: data.pdf_url, is_downloadable: !!data.is_downloadable }
      : {
          ...base,
          video_type: videoType,
          ...(videoType === 'youtube'   ? { video_key: data.video_key } : {}),
          ...(videoType === 'm3u8'      ? { video_url: data.video_url } : {}),
          ...(videoType === 'streaming' ? { streaming_platform: data.streaming_platform, streaming_key: data.streaming_key } : {}),
        }

    let result
    if (editLesson) {
      result = await dispatch(updateLessonThunk({ id: editLesson.id, data: payload }))
    } else {
      result = await dispatch(createLessonThunk(payload))
    }
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editLesson ? 'Lesson updated' : 'Lesson added')
      setLessonModal(false)
    } else {
      toast.error('Save failed')
    }
  }

  const confirmDelete = async () => {
    const result = await dispatch(deleteLessonThunk(deleteTarget.id))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Lesson deleted')
    } else {
      toast.error('Delete failed')
    }
    setDeleteTarget(null)
  }

  if (contentLoading && !chapter) return (
    <PageWrapper title="Chapter">
      <CardSkeleton count={4} />
    </PageWrapper>
  )

  if (!course || !semester || !subject || !chapter) return null

  return (
    <PageWrapper title="Lessons">
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
        <button onClick={() => navigate(`/courses/${courseId}/content/${semesterId}/${subjectId}`)} className="hover:text-gray-700 font-medium text-gray-700">
          {subject.name}
        </button>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <span className="text-indigo-600 font-medium">{chapter.name}</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(`/courses/${courseId}/content/${semesterId}/${subjectId}`)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{chapter.name}</h1>
          </div>
          {chapter.description && (
            <p className="text-sm text-gray-500">{chapter.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {chLessons.length} lesson{chLessons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Lesson
        </Button>
      </div>

      {/* Lesson list */}
      {chLessons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Video className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No lessons yet. Add the first one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {chLessons.map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 group transition">
                <span className="w-6 text-right text-xs text-gray-400 flex-shrink-0 tabular-nums">{idx + 1}</span>
                <LessonIcon lesson={lesson} />
                <span className="flex-1 text-sm font-medium text-gray-800 min-w-0 truncate">{lesson.name}</span>
                <LessonBadge lesson={lesson} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  <button onClick={() => openEdit(lesson)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(lesson)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      <Modal isOpen={lessonModal} onClose={() => setLessonModal(false)} title={editLesson ? 'Edit Lesson' : 'Add Lesson'}>
        <form onSubmit={lessonForm.handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Lesson Name"
            name="name"
            placeholder="e.g. Variables and Data Types"
            error={lessonForm.formState.errors.name?.message}
            {...lessonForm.register('name', { required: 'Name is required' })}
          />

          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Lesson Type</label>
            <div className="flex gap-3">
              {[
                { value: 'video', icon: Video,    label: 'Video' },
                { value: 'pdf',   icon: FileText, label: 'PDF / Notes' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLessonType(value)}
                  className={`flex items-center gap-2 flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition ${
                    lessonType === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Video fields */}
          {lessonType === 'video' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Video Source</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'youtube',   icon: PlayCircle, label: 'YouTube',              desc: 'Enter the YouTube video ID' },
                    { value: 'streaming', icon: Radio,      label: 'Third-party Streaming', desc: 'Vimeo, JW Player, Wistia, etc.' },
                    { value: 'm3u8',      icon: Film,       label: 'Direct M3U8',           desc: 'HLS stream URL (.m3u8)' },
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <label key={value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      videoType === value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value={value}
                        checked={videoType === value}
                        onChange={() => setVideoType(value)}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                          <Icon className="h-4 w-4" /> {label}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {videoType === 'youtube' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">YouTube Video ID</label>
                  <input
                    {...lessonForm.register('video_key', { required: 'Video ID is required' })}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  {lessonForm.formState.errors.video_key && (
                    <p className="text-xs text-red-600">{lessonForm.formState.errors.video_key.message}</p>
                  )}
                </div>
              )}

              {videoType === 'm3u8' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">M3U8 Stream URL</label>
                  <input
                    {...lessonForm.register('video_url', { required: 'URL is required' })}
                    placeholder="https://stream.example.com/video.m3u8"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {lessonForm.formState.errors.video_url && (
                    <p className="text-xs text-red-600">{lessonForm.formState.errors.video_url.message}</p>
                  )}
                </div>
              )}

              {videoType === 'streaming' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Platform Name</label>
                    <input
                      {...lessonForm.register('streaming_platform', { required: 'Platform is required' })}
                      placeholder="e.g. Vimeo, JW Player, Wistia"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {lessonForm.formState.errors.streaming_platform && (
                      <p className="text-xs text-red-600">{lessonForm.formState.errors.streaming_platform.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Stream Key / Video ID</label>
                    <input
                      {...lessonForm.register('streaming_key', { required: 'Stream key is required' })}
                      placeholder="e.g. abc123xyz"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    {lessonForm.formState.errors.streaming_key && (
                      <p className="text-xs text-red-600">{lessonForm.formState.errors.streaming_key.message}</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* PDF fields */}
          {lessonType === 'pdf' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> PDF URL
                </label>
                <input
                  {...lessonForm.register('pdf_url', { required: 'PDF URL is required' })}
                  placeholder="https://example.com/document.pdf"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {lessonForm.formState.errors.pdf_url && (
                  <p className="text-xs text-red-600">{lessonForm.formState.errors.pdf_url.message}</p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...lessonForm.register('is_downloadable')}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Allow Download</span>
                  <p className="text-xs text-gray-400">Students can download this PDF</p>
                </div>
              </label>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setLessonModal(false)}>Cancel</Button>
            <Button type="submit">{editLesson ? 'Update Lesson' : 'Add Lesson'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Lesson" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete lesson <strong>{deleteTarget?.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
