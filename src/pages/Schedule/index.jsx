import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { Play, FileText, ClipboardList, Bell, Plus, X, Video, Calendar, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  setSelectedSchedule,
  fetchEventsThunk, fetchCourseSchedulesThunk, createEventThunk, updateEventThunk, deleteEventThunk,
  createCourseScheduleThunk, updateCourseScheduleThunk,
} from '../../store/slices/scheduleSlice'
import { fetchSemestersThunk, fetchSubjectsThunk, fetchChaptersThunk, fetchLessonsThunk } from '../../store/slices/courseContentSlice'

const TYPE_COLORS = { LiveClass: '#3B82F6', Exam: '#EF4444', Activity: '#F59E0B' }
const TYPE_BADGE = { LiveClass: 'info', Exam: 'danger', Activity: 'warning' }
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TYPE_LABEL = { LiveClass: 'Live Class', Exam: 'Exam', Activity: 'Activity' }

function TypeIcon({ type, className }) {
  if (type === 'LiveClass') return <Video className={className} />
  if (type === 'Exam') return <FileText className={className} />
  return <ClipboardList className={className} />
}

// ─── Study Schedule Tab ──────────────────────────────────────────────────────

function StudyScheduleTab() {
  const dispatch = useAppDispatch()
  const courseSchedules = useAppSelector(s => s.schedule.courseSchedules)
  const selectedSchedule = useAppSelector(s => s.schedule.selectedSchedule)
  const courses = useAppSelector(s => s.courses.list)
  const semesters = useAppSelector(s => s.courseContent.semesters)
  const subjects = useAppSelector(s => s.courseContent.subjects)
  const lessons = useAppSelector(s => s.courseContent.lessons)

  // Left panel navigation state
  const [expandedCourseId, setExpandedCourseId] = useState(null)
  const [activeCourseId, setActiveCourseId] = useState(null)
  const [activeSemesterId, setActiveSemesterId] = useState(null)

  // Right panel state
  const [activeWeek, setActiveWeek] = useState(1)

  // Create / Edit Duration modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [sForm, setSForm] = useState({ startDate: '', endDate: '', weeks: 18 })

  // Lesson picker
  const [lessonPickerOpen, setLessonPickerOpen] = useState(false)
  const [pickerContext, setPickerContext] = useState(null)
  const [pickerPaperId, setPickerPaperId] = useState('')
  const [pickerSelected, setPickerSelected] = useState([])

  const suggestWeeks = (start, end) => {
    if (!start || !end) return 18
    const ms = new Date(end) - new Date(start)
    return Math.max(1, Math.round(ms / (7 * 24 * 60 * 60 * 1000)))
  }

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const selectSemester = (courseId, semId) => {
    const schedule = courseSchedules.find(s => s.course === courseId && s.semester === semId) || null
    dispatch(setSelectedSchedule(schedule))
    setActiveCourseId(courseId)
    setActiveSemesterId(semId)
    setActiveWeek(1)
  }

  const openCreateSchedule = () => {
    setIsEditingDuration(false)
    setSForm({ startDate: '', endDate: '', weeks: 18 })
    setScheduleModalOpen(true)
  }

  const openEditDuration = () => {
    setIsEditingDuration(true)
    setSForm({
      startDate: selectedSchedule.start_date,
      endDate: selectedSchedule.end_date,
      weeks: selectedSchedule.weeks,
    })
    setScheduleModalOpen(true)
  }

  const saveSchedule = async () => {
    if (!sForm.startDate || !sForm.endDate) {
      toast.error('Start date and end date are required')
      return
    }
    if (isEditingDuration) {
      const result = await dispatch(updateCourseScheduleThunk({
        id: selectedSchedule.id,
        data: { start_date: sForm.startDate, end_date: sForm.endDate, weeks: Number(sForm.weeks) },
      }))
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setSelectedSchedule(result.payload))
        toast.success('Duration updated')
      } else toast.error('Update failed')
    } else {
      const result = await dispatch(createCourseScheduleThunk({
        course: activeCourseId,
        semester: activeSemesterId,
        start_date: sForm.startDate,
        end_date: sForm.endDate,
        weeks: Number(sForm.weeks),
        days: [],
      }))
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(setSelectedSchedule(result.payload))
        toast.success('Schedule created')
      } else toast.error('Create failed')
    }
    setScheduleModalOpen(false)
  }

  const getDayLessons = (week, day) => {
    if (!selectedSchedule) return []
    return selectedSchedule.days.find(d => d.week === week && d.day === day)?.lessons || []
  }

  const removeLesson = async (week, day, idx) => {
    const updatedDays = selectedSchedule.days.map(d => {
      if (d.week !== week || d.day !== day) return d
      return { ...d, lessons: d.lessons.filter((_, i) => i !== idx) }
    })
    const result = await dispatch(updateCourseScheduleThunk({ id: selectedSchedule.id, data: { days: updatedDays } }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(setSelectedSchedule(result.payload))
    } else {
      toast.error('Failed to remove lesson')
    }
  }

  const openLessonPicker = (week, day) => {
    setPickerContext({ week, day })
    setPickerPaperId('')
    setPickerSelected([])
    setLessonPickerOpen(true)
  }

  const pickerPapers = useMemo(
    () => selectedSchedule ? subjects.filter(s => s.semester === selectedSchedule.semester) : [],
    [subjects, selectedSchedule]
  )

  const pickerLessons = useMemo(
    () => pickerPaperId ? lessons.filter(l => l.subject === Number(pickerPaperId)) : [],
    [lessons, pickerPaperId]
  )

  const toggleLesson = (id) =>
    setPickerSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const addSelectedLessons = async () => {
    if (!pickerContext || pickerSelected.length === 0) {
      toast.error('Select at least one lesson')
      return
    }
    const paper = subjects.find(s => s.id === Number(pickerPaperId))
    const newLessons = pickerSelected.map(lid => {
      const lesson = lessons.find(l => l.id === lid)
      return {
        paperId: Number(pickerPaperId),
        paperName: paper?.name || '',
        lessonId: lid,
        lessonType: lesson?.type || 'video',
        title: lesson?.name || '',
      }
    })
    const { week, day } = pickerContext
    const existingIdx = selectedSchedule.days.findIndex(d => d.week === week && d.day === day)
    const updatedDays = existingIdx >= 0
      ? selectedSchedule.days.map((d, i) =>
          i === existingIdx ? { ...d, lessons: [...d.lessons, ...newLessons] } : d
        )
      : [...selectedSchedule.days, { week, day, lessons: newLessons }]
    const result = await dispatch(updateCourseScheduleThunk({ id: selectedSchedule.id, data: { days: updatedDays } }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(setSelectedSchedule(result.payload))
      setLessonPickerOpen(false)
      toast.success(`${newLessons.length} lesson${newLessons.length > 1 ? 's' : ''} added`)
    } else {
      toast.error('Failed to add lessons')
    }
  }

  const activeCourse = courses.find(c => c.id === activeCourseId)
  const activeSemester = semesters.find(s => s.id === activeSemesterId)

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Left: Course → Semester Accordion ── */}
      <div className="lg:w-72 shrink-0 space-y-2">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Courses</h2>

        {courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
            No courses found.
          </div>
        )}

        {courses.map(course => {
          const isExpanded = expandedCourseId === course.id
          const courseSemesters = semesters.filter(s => s.course === course.id)
          return (
            <div key={course.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
              >
                <span className="font-medium text-gray-900 text-sm">{course.title}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  {courseSemesters.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400 italic">No semesters defined.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {courseSemesters.map(sem => {
                        const schedule = courseSchedules.find(
                          s => s.course === course.id && s.semester === sem.id
                        )
                        const isActive = activeCourseId === course.id && activeSemesterId === sem.id
                        return (
                          <button
                            key={sem.id}
                            onClick={() => selectSemester(course.id, sem.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition ${
                              isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <p className={`text-sm ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                                {sem.name}
                              </p>
                              {schedule ? (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {formatMonthYear(schedule.start_date)} – {formatMonthYear(schedule.end_date)}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 italic mt-0.5">Not set up</p>
                              )}
                            </div>
                            {isActive && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Right: Schedule Builder ── */}
      <div className="flex-1 min-w-0">

        {/* Nothing selected yet */}
        {!activeSemesterId && (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center text-gray-400 flex flex-col items-center gap-3">
            <Calendar className="h-12 w-12 opacity-25" />
            <p className="text-sm">Select a course and semester to view or create its schedule</p>
          </div>
        )}

        {/* Semester selected but no schedule */}
        {activeSemesterId && !selectedSchedule && (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center flex flex-col items-center gap-4">
            <Calendar className="h-12 w-12 text-gray-200" />
            <div>
              <p className="font-semibold text-gray-700">
                No schedule for {activeSemester?.name}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Define the study timeline for {activeCourse?.title} — {activeSemester?.name}
              </p>
            </div>
            <Button onClick={openCreateSchedule}>
              <Plus className="h-4 w-4 mr-1 inline" />Create Schedule
            </Button>
          </div>
        )}

        {/* Schedule exists — builder */}
        {selectedSchedule && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{selectedSchedule.course_title}</Badge>
                <Badge variant="default">{selectedSchedule.semester_name}</Badge>
                <span className="text-sm text-gray-500">
                  {formatMonthYear(selectedSchedule.start_date)} – {formatMonthYear(selectedSchedule.end_date)}
                </span>
                <span className="text-xs text-gray-400">({selectedSchedule.weeks} weeks)</span>
              </div>
              <Button variant="secondary" size="sm" onClick={openEditDuration}>
                Edit Duration
              </Button>
            </div>

            {/* Week Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {Array.from({ length: selectedSchedule.weeks }, (_, i) => i + 1).map(w => (
                <button
                  key={w}
                  onClick={() => setActiveWeek(w)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition shrink-0 ${
                    activeWeek === w
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Week {w}
                </button>
              ))}
            </div>

            {/* Day Slots */}
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 7 }, (_, i) => i + 1).map(dayNum => {
                const dayLessons = getDayLessons(activeWeek, dayNum)
                return (
                  <div key={dayNum} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        Week {activeWeek} · Day {dayNum} · {WEEKDAYS[dayNum - 1]}
                      </p>
                      <button
                        onClick={() => openLessonPicker(activeWeek, dayNum)}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Plus className="h-3 w-3" />Add Lesson
                      </button>
                    </div>
                    {dayLessons.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No lessons assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {dayLessons.map((lesson, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-1.5 text-xs">
                            {lesson.lessonType === 'video'
                              ? <Play className="h-3 w-3 text-indigo-500 shrink-0" />
                              : <FileText className="h-3 w-3 text-indigo-500 shrink-0" />
                            }
                            <span className="text-gray-800 font-medium">{lesson.title}</span>
                            {lesson.paperName && (
                              <span className="text-gray-500 hidden sm:inline">· {lesson.paperName}</span>
                            )}
                            <button onClick={() => removeLesson(activeWeek, dayNum, idx)} className="text-gray-400 hover:text-red-500 ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Duration Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={isEditingDuration ? 'Edit Semester Duration' : 'Create Schedule'}
        size="sm"
      >
        <div className="space-y-4">
          {!isEditingDuration && activeCourse && activeSemester && (
            <div className="flex gap-2">
              <Badge variant="info">{activeCourse.title}</Badge>
              <Badge variant="default">{activeSemester.name}</Badge>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={sForm.startDate}
                onChange={e => {
                  const start = e.target.value
                  setSForm(f => ({ ...f, startDate: start, weeks: suggestWeeks(start, f.endDate) }))
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">End Date</label>
              <input
                type="date"
                value={sForm.endDate}
                onChange={e => {
                  const end = e.target.value
                  setSForm(f => ({ ...f, endDate: end, weeks: suggestWeeks(f.startDate, end) }))
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Number of Weeks</label>
            <input
              type="number"
              min={1}
              max={52}
              value={sForm.weeks}
              onChange={e => setSForm(f => ({ ...f, weeks: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-calculated from dates above, adjust if needed</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSchedule}>{isEditingDuration ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Picker Modal */}
      <Modal
        isOpen={lessonPickerOpen}
        onClose={() => setLessonPickerOpen(false)}
        title={`Add Lessons — Week ${pickerContext?.week}, Day ${pickerContext?.day}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Select Paper / Subject</label>
            <select
              value={pickerPaperId}
              onChange={e => { setPickerPaperId(e.target.value); setPickerSelected([]) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a paper</option>
              {pickerPapers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {pickerPaperId && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Lessons</p>
              {pickerLessons.length === 0 ? (
                <p className="text-sm text-gray-400">No lessons found for this paper.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {pickerLessons.map(lesson => (
                    <label key={lesson.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pickerSelected.includes(lesson.id)}
                        onChange={() => toggleLesson(lesson.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {lesson.type === 'video'
                        ? <Play className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        : <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      }
                      <span className="text-sm text-gray-800 flex-1">{lesson.name}</span>
                      <Badge variant={lesson.type === 'video' ? 'info' : 'warning'}>{lesson.type}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setLessonPickerOpen(false)}>Cancel</Button>
            <Button onClick={addSelectedLessons}>
              Add Selected {pickerSelected.length > 0 ? `(${pickerSelected.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Events Tab ──────────────────────────────────────────────────────────────

function EventsTab() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const events = useAppSelector(s => s.schedule.events)
  const courses = useAppSelector(s => s.courses.list)
  const teachers = useAppSelector(s => s.teachers.list)
  const semesters = useAppSelector(s => s.courseContent.semesters)
  const subjects = useAppSelector(s => s.courseContent.subjects)

  const [typeFilter, setTypeFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('')
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)

  const emptyForm = {
    title: '', type: 'LiveClass', courseId: '', semesterId: '', paperId: '',
    teacherId: '', date: '', startTime: '', endTime: '', link: '', targetStudents: 'all',
  }
  const [eForm, setEForm] = useState(emptyForm)

  const formSemesters = useMemo(
    () => semesters.filter(s => s.course === Number(eForm.courseId)),
    [semesters, eForm.courseId]
  )
  const formPapers = useMemo(
    () => subjects.filter(s => s.semester === Number(eForm.semesterId)),
    [subjects, eForm.semesterId]
  )

  const filteredEvents = useMemo(() => {
    let list = [...events]
    if (typeFilter !== 'All') list = list.filter(e => e.type === typeFilter)
    if (courseFilter) list = list.filter(e => e.course === Number(courseFilter))
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [events, typeFilter, courseFilter])

  const calendarEvents = useMemo(() =>
    filteredEvents.map(e => ({
      id: String(e.id),
      title: e.title,
      date: e.date,
      backgroundColor: TYPE_COLORS[e.type] || '#4F46E5',
      borderColor: TYPE_COLORS[e.type] || '#4F46E5',
      extendedProps: e,
    })),
    [filteredEvents]
  )

  const openCreate = () => {
    setEditEvent(null)
    setEForm(emptyForm)
    setEventModalOpen(true)
  }

  const openEdit = (ev) => {
    setEditEvent(ev)
    setEForm({
      title: ev.title,
      type: ev.type,
      courseId: ev.course ? String(ev.course) : '',
      semesterId: ev.semester ? String(ev.semester) : '',
      paperId: ev.subject ? String(ev.subject) : '',
      teacherId: ev.teacher ? String(ev.teacher) : '',
      date: ev.date,
      startTime: ev.start_time,
      endTime: ev.end_time,
      link: ev.link || '',
      targetStudents: ev.target_students || 'all',
    })
    setDetailEvent(null)
    setEventModalOpen(true)
  }

  const saveEvent = async () => {
    if (!eForm.title || !eForm.date) { toast.error('Title and date are required'); return }
    const course = courses.find(c => c.id === Number(eForm.courseId))
    const paper = subjects.find(s => s.id === Number(eForm.paperId))
    const teacher = teachers.find(t => t.id === Number(eForm.teacherId))
    const payload = {
      ...eForm,
      courseId: Number(eForm.courseId) || null,
      semesterId: Number(eForm.semesterId) || null,
      paperId: Number(eForm.paperId) || null,
      teacherId: Number(eForm.teacherId) || null,
      courseName: course?.title || '',
      paperName: paper?.name || '',
      teacherName: teacher?.name || '',
      link: eForm.type === 'LiveClass' ? eForm.link : null,
    }
    const apiPayload = {
      title: payload.title,
      type: payload.type,
      course: payload.courseId || null,
      semester: payload.semesterId || null,
      subject: payload.paperId || null,
      teacher: payload.teacherId || null,
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      link: payload.link || '',
      target_students: payload.targetStudents || 'all',
    }
    if (editEvent) {
      const result = await dispatch(updateEventThunk({ id: editEvent.id, data: apiPayload }))
      if (result.meta.requestStatus === 'fulfilled') toast.success('Event updated')
      else toast.error('Update failed')
    } else {
      const result = await dispatch(createEventThunk(apiPayload))
      if (result.meta.requestStatus === 'fulfilled') toast.success('Event created')
      else toast.error('Create failed')
    }
    setEventModalOpen(false)
  }

  const TYPE_FILTER_OPTIONS = [
    { label: 'All', value: 'All' },
    { label: 'Live Class', value: 'LiveClass' },
    { label: 'Exam', value: 'Exam' },
    { label: 'Activity', value: 'Activity' },
  ]

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
            {TYPE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  typeFilter === opt.value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1 inline" />Create Event
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={({ event }) => setDetailEvent(event.extendedProps)}
          height="auto"
        />
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Upcoming Events</h3>
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
            No events found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEvents.map(ev => {
              const paper = subjects.find(s => s.id === ev.subject)
              const typeColor =
                ev.type === 'LiveClass' ? 'bg-blue-50 text-blue-500' :
                ev.type === 'Exam' ? 'bg-red-50 text-red-500' :
                'bg-amber-50 text-amber-500'
              return (
                <div key={ev.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2.5 shrink-0 ${typeColor}`}>
                      <TypeIcon type={ev.type} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{ev.title}</p>
                      {paper && <p className="text-xs text-gray-500 mt-0.5">{paper.name}</p>}
                    </div>
                    <Badge variant={TYPE_BADGE[ev.type]}>{TYPE_LABEL[ev.type]}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Bell className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{ev.date} · {ev.start_time}{ev.end_time !== ev.start_time ? ` – ${ev.end_time}` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <button onClick={() => openEdit(ev)} className="text-xs text-gray-400 hover:text-gray-600">
                      Edit
                    </button>
                    {ev.type === 'LiveClass' && (
                      <Button
                        size="sm"
                        onClick={() => ev.link ? window.open(ev.link, '_blank') : toast.error('No meeting link set')}
                      >
                        Join
                      </Button>
                    )}
                    {ev.type === 'Exam' && (
                      <Button size="sm" onClick={() => navigate('/quizzes')}>Start</Button>
                    )}
                    {ev.type === 'Activity' && (
                      <Button size="sm" variant="secondary">View</Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Modal isOpen={!!detailEvent} onClose={() => setDetailEvent(null)} title="Event Details" size="sm">
        {detailEvent && (
          <div className="space-y-3">
            <Badge variant={TYPE_BADGE[detailEvent.type]}>{TYPE_LABEL[detailEvent.type]}</Badge>
            <p className="text-lg font-semibold text-gray-900">{detailEvent.title}</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Date:</span> {detailEvent.date}</p>
              <p><span className="font-medium">Time:</span> {detailEvent.start_time} – {detailEvent.end_time}</p>
              {detailEvent.course_title && <p><span className="font-medium">Course:</span> {detailEvent.course_title}</p>}
              {detailEvent.teacher_name && <p><span className="font-medium">Teacher:</span> {detailEvent.teacher_name}</p>}
              {detailEvent.link && (
                <p>
                  <span className="font-medium">Link: </span>
                  <a href={detailEvent.link} target="_blank" rel="noreferrer" className="text-indigo-600 break-all">
                    {detailEvent.link}
                  </a>
                </p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(detailEvent)}>Edit</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Event Modal */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editEvent ? 'Edit Event' : 'Create Event'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input
              type="text"
              value={eForm.title}
              onChange={e => setEForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'LiveClass', label: 'Live Class', Icon: Video },
                { value: 'Exam', label: 'Exam', Icon: FileText },
                { value: 'Activity', label: 'Activity', Icon: ClipboardList },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEForm(f => ({ ...f, type: value }))}
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition ${
                    eForm.type === value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${eForm.type === value ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${eForm.type === value ? 'text-indigo-600' : 'text-gray-600'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Course</label>
              <select
                value={eForm.courseId}
                onChange={e => setEForm(f => ({ ...f, courseId: e.target.value, semesterId: '', paperId: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Semester</label>
              <select
                value={eForm.semesterId}
                onChange={e => setEForm(f => ({ ...f, semesterId: e.target.value, paperId: '' }))}
                disabled={!eForm.courseId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Semester</option>
                {formSemesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Paper / Subject</label>
              <select
                value={eForm.paperId}
                onChange={e => setEForm(f => ({ ...f, paperId: e.target.value }))}
                disabled={!eForm.semesterId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Paper</option>
                {formPapers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Teacher</label>
            <select
              value={eForm.teacherId}
              onChange={e => setEForm(f => ({ ...f, teacherId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'date', label: 'Date', type: 'date' },
              { key: 'startTime', label: 'Start Time', type: 'time' },
              { key: 'endTime', label: 'End Time', type: 'time' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  value={eForm[key]}
                  onChange={e => setEForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
          {eForm.type === 'LiveClass' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Meeting Link</label>
              <input
                type="text"
                value={eForm.link}
                onChange={e => setEForm(f => ({ ...f, link: e.target.value }))}
                placeholder="Google Meet or YouTube URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Target Students</label>
            <div className="flex gap-6">
              {[
                { value: 'all', label: 'All Enrolled' },
                { value: 'batch', label: 'Specific Batch' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetStudents"
                    value={value}
                    checked={eForm.targetStudents === value}
                    onChange={() => setEForm(f => ({ ...f, targetStudents: value }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEventModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent}>{editEvent ? 'Update Event' : 'Create Event'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const dispatch = useAppDispatch()
  const courseSchedules = useAppSelector(s => s.schedule.courseSchedules)
  const events = useAppSelector(s => s.schedule.events)
  const courseContentLessons = useAppSelector(s => s.courseContent.lessons)

  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    dispatch(fetchCourseSchedulesThunk())
    dispatch(fetchEventsThunk())
    dispatch(fetchSemestersThunk())
    dispatch(fetchSubjectsThunk())
    dispatch(fetchChaptersThunk())
    dispatch(fetchLessonsThunk())
  }, [dispatch])

  const TABS = ['Study Schedule', 'Events']

  return (
    <PageWrapper title="Schedule Management">
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === idx
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 0 && <StudyScheduleTab />}
      {activeTab === 1 && <EventsTab />}
    </PageWrapper>
  )
}
