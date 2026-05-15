import { useEffect, useState, useMemo, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { Play, FileText, ClipboardList, Bell, Plus, X, Video, Calendar, ChevronDown, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  setSelectedSchedule,
  fetchEventsThunk, fetchCourseSchedulesThunk, createEventThunk, updateEventThunk,
  createCourseScheduleThunk, updateCourseScheduleThunk,
} from '../../store/slices/scheduleSlice'
import { fetchSemestersThunk, fetchSubjectsThunk, fetchChaptersThunk, fetchLessonsThunk } from '../../store/slices/courseContentSlice'
import { fetchQuizzesThunk } from '../../store/slices/quizSlice'
import { fetchQuizzes as fetchQuizzesAPI } from '../../services/assessmentService'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'
import { fetchTeachersThunk } from '../../store/slices/teacherSlice'

const TYPE_COLORS = { LiveClass: '#3B82F6', Activity: '#F59E0B' }
const TYPE_BADGE = { LiveClass: 'info', Activity: 'warning' }
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TYPE_LABEL = { LiveClass: 'Live Class', Activity: 'Activity' }

function TypeIcon({ type, className }) {
  if (type === 'LiveClass') return <Video className={className} />
  return <ClipboardList className={className} />
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getWeekDayRange(weekIndex, totalWeeks, startDate, endDate) {
  const toWeekday = (dateStr) => {
    const js = new Date(dateStr + 'T00:00:00').getDay() // 0=Sun
    return js === 0 ? 7 : js // 1=Mon … 7=Sun
  }
  const startDay = toWeekday(startDate)
  const endDay = toWeekday(endDate)

  if (weekIndex === 1 && weekIndex === totalWeeks) {
    return Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)
  }
  if (weekIndex === 1) return Array.from({ length: 7 - startDay + 1 }, (_, i) => startDay + i)
  if (weekIndex === totalWeeks) return Array.from({ length: endDay }, (_, i) => i + 1)
  return [1, 2, 3, 4, 5, 6, 7]
}

function parseDurationToDays(durationStr) {
  if (!durationStr) return 0
  const match = durationStr.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(year|month|week|day)s?$/)
  if (!match) return 0
  const n = parseFloat(match[1])
  switch (match[2]) {
    case 'year':  return Math.round(n * 365)
    case 'month': return Math.round(n * 30)
    case 'week':  return Math.round(n * 7)
    case 'day':   return Math.round(n)
    default:      return 0
  }
}

function computeScheduleDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const diff = new Date(endDate + 'T00:00:00') - new Date(startDate + 'T00:00:00')
  return Math.max(0, Math.round(diff / 86400000) + 1)
}

// ─── Duration Allocation Bar ──────────────────────────────────────────────────

function DurationAllocationBar({ totalDays, usedDays, hasOverlap }) {
  if (totalDays === 0) return null
  const pct = Math.min(100, Math.round((usedDays / totalDays) * 100))
  const isOver = usedDays > totalDays
  const barColor = isOver || hasOverlap ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-indigo-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{usedDays} / {totalDays} days used</span>
        <span className={isOver ? 'text-red-500 font-medium' : 'text-gray-400'}>
          {isOver ? `${usedDays - totalDays} days over` : `${totalDays - usedDays} days remaining`}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {hasOverlap && (
        <p className="text-xs text-red-500">Warning: semester date ranges overlap</p>
      )}
    </div>
  )
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


  // Left panel navigation state — initialized from Redux so tab-switching restores selection
  const [expandedCourseId, setExpandedCourseId] = useState(() => selectedSchedule?.course ?? null)
  const [activeCourseId, setActiveCourseId] = useState(() => selectedSchedule?.course ?? null)
  const [activeSemesterId, setActiveSemesterId] = useState(() => selectedSchedule?.semester ?? null)

  // Course search
  const [courseSearch, setCourseSearch] = useState('')

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

  // Quiz picker
  const [quizPickerOpen, setQuizPickerOpen] = useState(false)
  const [quizPickerContext, setQuizPickerContext] = useState(null)
  const [quizPickerSelected, setQuizPickerSelected] = useState([])
  const [quizSearchQuery, setQuizSearchQuery] = useState('')
  const [quizSearchResults, setQuizSearchResults] = useState([])
  const [quizSearchLoading, setQuizSearchLoading] = useState(false)

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

  const getDayQuizzes = (week, day) => {
    if (!selectedSchedule) return []
    return selectedSchedule.days.find(d => d.week === week && d.day === day)?.quizzes || []
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

  const removeQuiz = async (week, day, idx) => {
    const updatedDays = selectedSchedule.days.map(d => {
      if (d.week !== week || d.day !== day) return d
      return { ...d, quizzes: (d.quizzes || []).filter((_, i) => i !== idx) }
    })
    const result = await dispatch(updateCourseScheduleThunk({ id: selectedSchedule.id, data: { days: updatedDays } }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(setSelectedSchedule(result.payload))
    } else {
      toast.error('Failed to remove quiz')
    }
  }

  const loadQuizPickerResults = useCallback(async (query) => {
    if (!selectedSchedule) return
    setQuizSearchLoading(true)
    try {
      const data = await fetchQuizzesAPI({ course: selectedSchedule.course, ...(query ? { search: query } : {}) })
      setQuizSearchResults(data.results ?? data)
    } catch {
      setQuizSearchResults([])
    } finally {
      setQuizSearchLoading(false)
    }
  }, [selectedSchedule])

  // Debounced search — fires 350ms after the user stops typing
  useEffect(() => {
    if (!quizPickerOpen) return
    const timer = setTimeout(() => loadQuizPickerResults(quizSearchQuery), 350)
    return () => clearTimeout(timer)
  }, [quizSearchQuery, quizPickerOpen, loadQuizPickerResults])

  // Maps a quiz ID to every day it has already been added on in this schedule
  const getQuizAddedDays = useCallback((quizId) => {
    if (!selectedSchedule) return []
    return selectedSchedule.days
      .filter(d => (d.quizzes || []).some(q => q.quizId === quizId))
      .map(d => `Week ${d.week} · Day ${d.day} · ${WEEKDAYS[d.day - 1]}`)
  }, [selectedSchedule])

  const openLessonPicker = (week, day) => {
    setPickerContext({ week, day })
    setPickerPaperId('')
    setPickerSelected([])
    setLessonPickerOpen(true)
  }

  const openQuizPicker = (week, day) => {
    setQuizPickerContext({ week, day })
    setQuizPickerSelected([])
    setQuizSearchQuery('')
    setQuizSearchResults([])
    setQuizPickerOpen(true)
    loadQuizPickerResults('')
  }

  const filteredCourses = useMemo(
    () => courseSearch.trim()
      ? courses.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
      : courses,
    [courses, courseSearch]
  )

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

  const toggleQuizSelection = (id) =>
    setQuizPickerSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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
      : [...selectedSchedule.days, { week, day, lessons: newLessons, quizzes: [] }]
    const result = await dispatch(updateCourseScheduleThunk({ id: selectedSchedule.id, data: { days: updatedDays } }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(setSelectedSchedule(result.payload))
      setLessonPickerOpen(false)
      toast.success(`${newLessons.length} lesson${newLessons.length > 1 ? 's' : ''} added`)
    } else {
      toast.error('Failed to add lessons')
    }
  }

  const addSelectedQuizzes = async () => {
    if (!quizPickerContext || quizPickerSelected.length === 0) {
      toast.error('Select at least one quiz')
      return
    }
    const newQuizzes = quizPickerSelected.map(qid => {
      const quiz = quizSearchResults.find(q => q.id === qid)
      return { quizId: qid, quizTitle: quiz?.title || '' }
    })
    const { week, day } = quizPickerContext
    const existingIdx = selectedSchedule.days.findIndex(d => d.week === week && d.day === day)
    const updatedDays = existingIdx >= 0
      ? selectedSchedule.days.map((d, i) =>
          i === existingIdx ? { ...d, quizzes: [...(d.quizzes || []), ...newQuizzes] } : d
        )
      : [...selectedSchedule.days, { week, day, lessons: [], quizzes: newQuizzes }]
    const result = await dispatch(updateCourseScheduleThunk({ id: selectedSchedule.id, data: { days: updatedDays } }))
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(setSelectedSchedule(result.payload))
      setQuizPickerOpen(false)
      toast.success(`${newQuizzes.length} quiz${newQuizzes.length > 1 ? 'zes' : ''} added`)
    } else {
      toast.error('Failed to add quizzes')
    }
  }

  // Duration allocation: compute per-course when a course is expanded
  const courseAllocation = useMemo(() => {
    if (!expandedCourseId) return null
    const course = courses.find(c => c.id === expandedCourseId)
    if (!course) return null
    const totalDays = parseDurationToDays(course.duration)
    const courseSemesters = semesters.filter(s => s.course === expandedCourseId)
    const semesterRanges = courseSemesters.map(sem => {
      const schedule = courseSchedules.find(s => s.course === expandedCourseId && s.semester === sem.id)
      return schedule
        ? { semId: sem.id, start: schedule.start_date, end: schedule.end_date, days: computeScheduleDays(schedule.start_date, schedule.end_date) }
        : { semId: sem.id, start: null, end: null, days: 0 }
    })
    const usedDays = semesterRanges.reduce((acc, r) => acc + r.days, 0)
    const scheduled = semesterRanges.filter(r => r.start && r.end).sort((a, b) => a.start.localeCompare(b.start))
    let hasOverlap = false
    for (let i = 0; i < scheduled.length - 1; i++) {
      if (scheduled[i].end >= scheduled[i + 1].start) { hasOverlap = true; break }
    }
    return { totalDays, usedDays, hasOverlap }
  }, [expandedCourseId, courses, semesters, courseSchedules])

  const activeCourse = courses.find(c => c.id === activeCourseId)
  const activeSemester = semesters.find(s => s.id === activeSemesterId)

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Left: Course → Semester Accordion ── */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800">Courses</h2>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={courseSearch}
            onChange={e => setCourseSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {courseSearch && (
            <button
              onClick={() => setCourseSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {filteredCourses.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">
              {courseSearch ? 'No matching courses.' : 'No courses found.'}
            </div>
          )}

          {filteredCourses.map(course => {
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

                  {/* Duration allocation bar */}
                  {courseAllocation && expandedCourseId === course.id && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <DurationAllocationBar
                        totalDays={courseAllocation.totalDays}
                        usedDays={courseAllocation.usedDays}
                        hasOverlap={courseAllocation.hasOverlap}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>{/* end scrollable list */}
      </div>

      {/* ── Right: Schedule Builder ── */}
      <div className="flex-1 min-w-0">

        {/* Nothing selected yet */}
        {!activeSemesterId && !selectedSchedule && (
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
              {getWeekDayRange(activeWeek, selectedSchedule.weeks, selectedSchedule.start_date, selectedSchedule.end_date)
                .map(dayNum => {
                  const dayLessons = getDayLessons(activeWeek, dayNum)
                  const dayQuizzes = getDayQuizzes(activeWeek, dayNum)
                  return (
                    <div key={dayNum} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          Week {activeWeek} · Day {dayNum} · {WEEKDAYS[dayNum - 1]}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openLessonPicker(activeWeek, dayNum)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <Plus className="h-3 w-3" />Add Lesson
                          </button>
                          <button
                            onClick={() => openQuizPicker(activeWeek, dayNum)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            <Plus className="h-3 w-3" />Add Quiz
                          </button>
                        </div>
                      </div>

                      {dayLessons.length === 0 && dayQuizzes.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No lessons or quizzes assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLessons.length > 0 && (
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
                          {dayQuizzes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {dayQuizzes.map((quiz, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-1.5 text-xs">
                                  <BookOpen className="h-3 w-3 text-purple-500 shrink-0" />
                                  <span className="text-gray-800 font-medium">{quiz.quizTitle}</span>
                                  <button onClick={() => removeQuiz(activeWeek, dayNum, idx)} className="text-gray-400 hover:text-red-500 ml-0.5">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
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

          {/* Live duration allocation in modal */}
          {(() => {
            const course = courses.find(c => c.id === activeCourseId)
            if (!course) return null
            const totalDays = parseDurationToDays(course.duration)
            if (totalDays === 0) return null
            const otherSchedules = courseSchedules.filter(
              s => s.course === activeCourseId && s.semester !== activeSemesterId
            )
            const otherUsedDays = otherSchedules.reduce(
              (acc, s) => acc + computeScheduleDays(s.start_date, s.end_date), 0
            )
            const currentDays = computeScheduleDays(sForm.startDate, sForm.endDate)
            const totalUsed = otherUsedDays + currentDays
            return (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">Course duration allocation</p>
                <DurationAllocationBar totalDays={totalDays} usedDays={totalUsed} hasOverlap={false} />
                <p className="text-xs text-gray-400">
                  This semester: {currentDays} days · Other semesters: {otherUsedDays} days
                </p>
              </div>
            )
          })()}

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

      {/* Quiz Picker Modal */}
      <Modal
        isOpen={quizPickerOpen}
        onClose={() => setQuizPickerOpen(false)}
        title={`Add Quizzes — Week ${quizPickerContext?.week}, Day ${quizPickerContext?.day} · ${WEEKDAYS[(quizPickerContext?.day ?? 1) - 1]}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={quizSearchQuery}
              onChange={e => setQuizSearchQuery(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            {quizSearchQuery && (
              <button
                onClick={() => setQuizSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          {quizSearchLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
              <div className="h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              Searching…
            </div>
          ) : quizSearchResults.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              {quizSearchQuery ? 'No quizzes match your search.' : 'No quizzes found for this course.'}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-0.5">
              {quizSearchResults.map(quiz => {
                const addedDays = getQuizAddedDays(quiz.id)
                const alreadyOnThisDay = addedDays.some(
                  label => label === `Week ${quizPickerContext?.week} · Day ${quizPickerContext?.day} · ${WEEKDAYS[(quizPickerContext?.day ?? 1) - 1]}`
                )
                return (
                  <label key={quiz.id} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition ${alreadyOnThisDay ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={quizPickerSelected.includes(quiz.id)}
                      onChange={() => toggleQuizSelection(quiz.id)}
                      className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shrink-0"
                    />
                    <BookOpen className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-800 font-medium leading-snug">{quiz.title}</span>
                        {quiz.status && (
                          <Badge variant={quiz.status === 'Published' ? 'success' : 'default'}>{quiz.status}</Badge>
                        )}
                      </div>
                      {addedDays.length > 0 && (
                        <p className="text-xs text-purple-600 mt-0.5">
                          Already added on: {addedDays.join(', ')}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setQuizPickerOpen(false)}>Cancel</Button>
            <Button onClick={addSelectedQuizzes}>
              Add Selected {quizPickerSelected.length > 0 ? `(${quizPickerSelected.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Events Tab ──────────────────────────────────────────────────────────────

function EventsTab() {
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
    const apiPayload = {
      title: eForm.title,
      type: eForm.type,
      course: Number(eForm.courseId) || null,
      semester: Number(eForm.semesterId) || null,
      subject: Number(eForm.paperId) || null,
      teacher: Number(eForm.teacherId) || null,
      date: eForm.date,
      start_time: eForm.startTime,
      end_time: eForm.endTime,
      link: eForm.type === 'LiveClass' ? eForm.link : '',
      target_students: eForm.targetStudents || 'all',
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
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'LiveClass', label: 'Live Class', Icon: Video },
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

  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    dispatch(fetchCoursesThunk())
    dispatch(fetchTeachersThunk())
    dispatch(fetchCourseSchedulesThunk())
    dispatch(fetchEventsThunk())
    dispatch(fetchSemestersThunk())
    dispatch(fetchSubjectsThunk())
    dispatch(fetchChaptersThunk())
    dispatch(fetchLessonsThunk())
    dispatch(fetchQuizzesThunk())
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
