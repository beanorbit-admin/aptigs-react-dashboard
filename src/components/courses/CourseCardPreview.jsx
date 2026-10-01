import { Clock, PlayCircle, UserCircle2 } from 'lucide-react'
import { themeGradient } from '../../hooks/useCardThemes'

// Mirrors the "My Courses" card in the student app.
export default function CourseCardPreview({ title, description, image, theme, tutor, durationHours, lessonCount, className = '' }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden p-4 text-white shadow-sm ${className}`} style={{ background: themeGradient(theme) }}>
      <div className="w-3/5 min-h-[5rem]">
        <p className="font-semibold leading-tight line-clamp-2">{title || 'Course title'}</p>
        {description && <p className="text-xs text-white/85 mt-1 line-clamp-3">{description}</p>}
      </div>
      {image && <img src={image} alt="" className="absolute right-3 top-3 h-24 w-24 object-contain" />}
      <div className="h-1.5 w-3/4 rounded-full bg-white/30 mt-3">
        <div className="h-full w-1/3 rounded-full bg-white" />
      </div>
      <div className="flex items-center gap-3 mt-3">
        {tutor?.photo
          ? <img src={tutor.photo} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-white/70" />
          : <UserCircle2 className="h-10 w-10 text-white/70" />}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{tutor?.name || 'No tutor assigned'}</p>
          {tutor?.designation && <p className="text-xs text-white/85 truncate">{tutor.designation}</p>}
          <div className="flex gap-3 text-[11px] text-white/85 mt-0.5">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationHours ?? '—'} hr</span>
            <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />{lessonCount ?? '—'} Lesson</span>
          </div>
        </div>
      </div>
    </div>
  )
}
