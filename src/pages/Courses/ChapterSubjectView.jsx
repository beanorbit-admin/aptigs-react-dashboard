import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ChevronRight, Pencil, Trash2, Plus, PlayCircle, Film, Radio,
  FileText, Download, ExternalLink, Video, BookOpen,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  setCourseContent,
  addChapter, updateChapter, deleteChapter,
  addLesson, updateLesson, deleteLesson,
} from '../../store/slices/courseContentSlice'
import { setCourses } from '../../store/slices/courseSlice'
import {
  semesters as mockSemesters, subjects as mockSubjects,
  chapters as mockChapters, lessons as mockLessons,
} from '../../mock/courseContent'
import { courses as mockCourses } from '../../mock/courses'

const VIDEO_TYPE_LABELS = { youtube: 'YouTube', streaming: 'Streaming', m3u8: 'M3U8' }
const VIDEO_TYPE_VARIANTS = { youtube: 'danger', streaming: 'info', m3u8: 'purple' }

function LessonIcon({ lesson }) {
  if (lesson.type === 'pdf') return <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
  if (lesson.videoType === 'youtube') return <PlayCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
  if (lesson.videoType === 'streaming') return <Radio className="h-4 w-4 text-blue-500 flex-shrink-0" />
  return <Film className="h-4 w-4 text-purple-500 flex-shrink-0" />
}

function LessonRow({ lesson, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 group">
      <LessonIcon lesson={lesson} />
      <span className="flex-1 text-sm text-gray-800">{lesson.name}</span>
      <div className="flex items-center gap-2">
        {lesson.type === 'video' && (
          <Badge variant={VIDEO_TYPE_VARIANTS[lesson.videoType]}>
            {VIDEO_TYPE_LABELS[lesson.videoType]}
          </Badge>
        )}
        {lesson.type === 'pdf' && lesson.isDownloadable && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Download className="h-3 w-3" /> Downloadable
          </span>
        )}
        {lesson.type === 'pdf' && !lesson.isDownloadable && (
          <span className="text-xs text-gray-400">View only</span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onEdit(lesson)} className="p-1 text-amber-600 hover:bg-amber-50 rounded transition">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(lesson)} className="p-1 text-red-500 hover:bg-red-50 rounded transition">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function ChapterSubjectView() {
  const { courseId, semesterId, subjectId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const courses = useAppSelector(s => s.courses.list)
  const { semesters, subjects, chapters, lessons } = useAppSelector(s => s.courseContent)

  // Chapter modal
  const [chapterModal, setChapterModal] = useState(false)
  const [editChapter, setEditChapter] = useState(null)
  const [deleteChapterTarget, setDeleteChapterTarget] = useState(null)

  // Lesson modal
  const [lessonModal, setLessonModal] = useState(false)
  const [lessonForChapter, setLessonForChapter] = useState(null)
  const [editLesson, setEditLesson] = useState(null)
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null)
  const [lessonType, setLessonType] = useState('video')
  const [videoType, setVideoType] = useState('youtube')

  const chapterForm = useForm()
  const lessonForm = useForm()

  useEffect(() => {
    if (courses.length === 0) dispatch(setCourses(mockCourses))
    if (semesters.length === 0) {
      dispatch(setCourseContent({ semesters: mockSemesters, subjects: mockSubjects, chapters: mockChapters, lessons: mockLessons }))
    }
  }, [courses.length, semesters.length, dispatch])

  const course   = courses.find(c => c.id === Number(courseId))
  const semester = semesters.find(s => s.id === Number(semesterId))
  const subject  = subjects.find(s => s.id === Number(subjectId))

  const subjectChapters = chapters
    .filter(c => c.subjectId === Number(subjectId))
    .sort((a, b) => a.order - b.order)

  const chapterLessons = (chId) => lessons
    .filter(l => l.chapterId === chId)
    .sort((a, b) => a.order - b.order)

  // ---- Chapter handlers ----
  const openAddChapter = () => {
    setEditChapter(null)
    chapterForm.reset({ name: '', description: '' })
    setChapterModal(true)
  }
  const openEditChapter = (ch) => {
    setEditChapter(ch)
    chapterForm.reset({ name: ch.name, description: ch.description })
    setChapterModal(true)
  }
  const onSaveChapter = (data) => {
    if (editChapter) {
      dispatch(updateChapter({ ...editChapter, ...data }))
      toast.success('Chapter updated')
    } else {
      dispatch(addChapter({
        id: Date.now(),
        subjectId: Number(subjectId),
        semesterId: Number(semesterId),
        courseId: Number(courseId),
        name: data.name,
        description: data.description,
        order: subjectChapters.length + 1,
      }))
      toast.success('Chapter added')
    }
    setChapterModal(false)
  }
  const confirmDeleteChapter = () => {
    dispatch(deleteChapter(deleteChapterTarget.id))
    toast.success('Chapter deleted')
    setDeleteChapterTarget(null)
  }

  // ---- Lesson handlers ----
  const openAddLesson = (chId) => {
    setEditLesson(null)
    setLessonForChapter(chId)
    setLessonType('video')
    setVideoType('youtube')
    lessonForm.reset({ name: '', videoUrl: '', streamingPlatform: '', streamingKey: '', pdfUrl: '', isDownloadable: true })
    setLessonModal(true)
  }
  const openEditLesson = (lesson) => {
    setEditLesson(lesson)
    setLessonForChapter(lesson.chapterId)
    setLessonType(lesson.type)
    setVideoType(lesson.videoType || 'youtube')
    lessonForm.reset({
      name: lesson.name,
      videoUrl: lesson.videoUrl || '',
      streamingPlatform: lesson.streamingPlatform || '',
      streamingKey: lesson.streamingKey || '',
      pdfUrl: lesson.pdfUrl || '',
      isDownloadable: lesson.isDownloadable ?? true,
    })
    setLessonModal(true)
  }
  const onSaveLesson = (data) => {
    const base = {
      chapterId: lessonForChapter,
      subjectId: Number(subjectId),
      semesterId: Number(semesterId),
      courseId: Number(courseId),
      name: data.name,
      type: lessonType,
    }
    const payload = lessonType === 'pdf'
      ? { ...base, pdfUrl: data.pdfUrl, isDownloadable: !!data.isDownloadable }
      : {
          ...base,
          videoType,
          ...(videoType === 'youtube'   ? { videoUrl: data.videoUrl } : {}),
          ...(videoType === 'm3u8'      ? { videoUrl: data.videoUrl } : {}),
          ...(videoType === 'streaming' ? { streamingPlatform: data.streamingPlatform, streamingKey: data.streamingKey } : {}),
        }

    if (editLesson) {
      dispatch(updateLesson({ ...editLesson, ...payload }))
      toast.success('Lesson updated')
    } else {
      const chLessons = chapterLessons(lessonForChapter)
      dispatch(addLesson({ ...payload, id: Date.now(), order: chLessons.length + 1 }))
      toast.success('Lesson added')
    }
    setLessonModal(false)
  }
  const confirmDeleteLesson = () => {
    dispatch(deleteLesson(deleteLessonTarget.id))
    toast.success('Lesson deleted')
    setDeleteLessonTarget(null)
  }

  if (!course || !semester || !subject) return null

  return (
    <PageWrapper title={subject.name}>
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

      {/* Subject heading */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">{subject.name}</h1>
          </div>
          {subject.description && (
            <p className="text-sm text-gray-500">{subject.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {subjectChapters.length} chapter{subjectChapters.length !== 1 ? 's' : ''} · {course.title} / {semester.name}
          </p>
        </div>
        <Button onClick={openAddChapter}>
          <Plus className="h-4 w-4" /> Add Chapter
        </Button>
      </div>

      {/* Chapters */}
      {subjectChapters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Video className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No chapters yet. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjectChapters.map((ch, idx) => {
            const chLessons = chapterLessons(ch.id)
            return (
              <div key={ch.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Chapter header */}
                <div className="flex items-start gap-3 p-5 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{ch.name}</p>
                    {ch.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{ch.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {chLessons.length} lesson{chLessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditChapter(ch)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition" title="Edit chapter">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteChapterTarget(ch)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete chapter">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons list */}
                <div className="px-5 py-3">
                  {chLessons.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">No lessons yet</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {chLessons.map(lesson => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          onEdit={openEditLesson}
                          onDelete={setDeleteLessonTarget}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => openAddLesson(ch.id)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-3 font-medium"
                  >
                    <Plus className="h-4 w-4" /> Add Lesson
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Chapter Modal ── */}
      <Modal isOpen={chapterModal} onClose={() => setChapterModal(false)} title={editChapter ? 'Edit Chapter' : 'Add Chapter'} size="sm">
        <form onSubmit={chapterForm.handleSubmit(onSaveChapter)} className="space-y-4">
          <Input
            label="Chapter Name"
            name="name"
            placeholder="e.g. Introduction to C"
            error={chapterForm.formState.errors.name?.message}
            {...chapterForm.register('name', { required: 'Name is required' })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...chapterForm.register('description')}
              placeholder="Brief overview of this chapter"
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => setChapterModal(false)}>Cancel</Button>
            <Button type="submit">{editChapter ? 'Update' : 'Add Chapter'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Lesson Modal ── */}
      <Modal isOpen={lessonModal} onClose={() => setLessonModal(false)} title={editLesson ? 'Edit Lesson' : 'Add Lesson'}>
        <form onSubmit={lessonForm.handleSubmit(onSaveLesson)} className="space-y-4">
          {/* Lesson name */}
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
                { value: 'video', icon: Video, label: 'Video' },
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
                    { value: 'youtube',   icon: PlayCircle, label: 'YouTube', desc: 'Paste a YouTube video URL' },
                    { value: 'streaming', icon: Radio,   label: 'Third-party Streaming', desc: 'Vimeo, JW Player, Wistia, etc.' },
                    { value: 'm3u8',      icon: Film,    label: 'Direct M3U8', desc: 'HLS stream URL (.m3u8)' },
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

              {(videoType === 'youtube' || videoType === 'm3u8') && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    {videoType === 'youtube' ? 'YouTube URL' : 'M3U8 Stream URL'}
                  </label>
                  <input
                    {...lessonForm.register('videoUrl', { required: 'URL is required' })}
                    placeholder={
                      videoType === 'youtube'
                        ? 'https://www.youtube.com/watch?v=...'
                        : 'https://stream.example.com/video.m3u8'
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {lessonForm.formState.errors.videoUrl && (
                    <p className="text-xs text-red-600">{lessonForm.formState.errors.videoUrl.message}</p>
                  )}
                </div>
              )}

              {videoType === 'streaming' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Platform Name</label>
                    <input
                      {...lessonForm.register('streamingPlatform', { required: 'Platform is required' })}
                      placeholder="e.g. Vimeo, JW Player, Wistia"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {lessonForm.formState.errors.streamingPlatform && (
                      <p className="text-xs text-red-600">{lessonForm.formState.errors.streamingPlatform.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Stream Key / Video ID</label>
                    <input
                      {...lessonForm.register('streamingKey', { required: 'Stream key is required' })}
                      placeholder="e.g. abc123xyz"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    {lessonForm.formState.errors.streamingKey && (
                      <p className="text-xs text-red-600">{lessonForm.formState.errors.streamingKey.message}</p>
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
                  {...lessonForm.register('pdfUrl', { required: 'PDF URL is required' })}
                  placeholder="https://example.com/document.pdf"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {lessonForm.formState.errors.pdfUrl && (
                  <p className="text-xs text-red-600">{lessonForm.formState.errors.pdfUrl.message}</p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...lessonForm.register('isDownloadable')}
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

      {/* Delete Chapter confirm */}
      <Modal isOpen={!!deleteChapterTarget} onClose={() => setDeleteChapterTarget(null)} title="Delete Chapter" size="sm">
        <p className="text-sm text-gray-600 mb-2">Delete chapter <strong>{deleteChapterTarget?.name}</strong>?</p>
        <p className="text-xs text-gray-400 mb-6">All lessons inside will also be removed.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteChapterTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteChapter}>Delete</Button>
        </div>
      </Modal>

      {/* Delete Lesson confirm */}
      <Modal isOpen={!!deleteLessonTarget} onClose={() => setDeleteLessonTarget(null)} title="Delete Lesson" size="sm">
        <p className="text-sm text-gray-600 mb-6">Delete lesson <strong>{deleteLessonTarget?.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteLessonTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteLesson}>Delete</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
