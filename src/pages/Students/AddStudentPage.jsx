import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Badge from '../../components/common/Badge'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { createStudentThunk } from '../../store/slices/studentSlice'
import { createEnrollmentThunk } from '../../store/slices/enrollmentSlice'
import { fetchCoursesThunk } from '../../store/slices/courseSlice'

const COUNTRY_CODES = ['+91', '+1', '+44', '+971', '+61', '+65', '+60']

export default function AddStudentPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const courses = useAppSelector(state => state.courses.list)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      country_code: '+91',
      phone: '',
      place: '',
      enroll: false,
      courseId: '',
      accessType: 'granted',
    },
  })

  const enroll = watch('enroll')
  const accessType = watch('accessType')
  const selectedCourseId = watch('courseId')

  useEffect(() => {
    if (courses.length === 0) dispatch(fetchCoursesThunk())
  }, [courses.length, dispatch])

  const activeCourses = courses.filter(c => c.status === 'Active')
  const selectedCourse = courses.find(c => c.id === Number(selectedCourseId))

  const onSubmit = async (data) => {
    const result = await dispatch(createStudentThunk({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      country_code: data.country_code,
      phone: data.phone,
      place: data.place,
    }))
    if (result.meta.requestStatus !== 'fulfilled') {
      toast.error('Failed to add student')
      return
    }
    const student = result.payload

    if (data.enroll && data.courseId && selectedCourse) {
      const enrollResult = await dispatch(createEnrollmentThunk({
        student: student.id,
        course: selectedCourse.id,
        course_fee: selectedCourse.fee,
        collected_amount: 0,
        access_status: data.accessType,
        enrollment_type: data.accessType === 'granted' ? 'direct' : 'request',
      }))
      const name = `${data.first_name} ${data.last_name}`
      if (enrollResult.meta.requestStatus === 'fulfilled') {
        toast.success(data.accessType === 'granted' ? `${name} added and access granted` : `${name} added — enrollment pending approval`)
      } else {
        toast.success('Student added, but enrollment failed')
      }
    } else {
      toast.success('Student added successfully')
    }
    navigate('/students')
  }

  return (
    <PageWrapper title="Add Student">
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
            Student Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              placeholder="First name"
              error={errors.first_name?.message}
              register={n => register(n, { required: 'First name is required' })}
            />
            <Input
              label="Last Name"
              name="last_name"
              placeholder="Last name"
              error={errors.last_name?.message}
              register={n => register(n, { required: 'Last name is required' })}
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            register={n => register(n, { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' } })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <div className="flex gap-2">
              <select
                {...register('country_code')}
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^\d{6,15}$/, message: 'Enter 6–15 digits' },
                })}
                placeholder="Phone number"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
          </div>

          <Input
            label="Place"
            name="place"
            placeholder="City / Location"
            error={errors.place?.message}
            register={n => register(n, { required: 'Place is required' })}
          />
        </div>

        {/* Enrollment */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-800">Enrollment</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('enroll')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">Enroll this student in a course now</span>
            </label>
          </div>

          {enroll && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Course</label>
                <select
                  {...register('courseId', {
                    validate: val => !enroll || !!val || 'Please select a course',
                  })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select a course --</option>
                  {activeCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} — ₹{c.fee.toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.courseId && <p className="text-xs text-red-600">{errors.courseId.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Access Type</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="granted"
                      {...register('accessType')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">Grant Access Immediately</span>
                      <p className="text-xs text-gray-500">Student gets access right away</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="pending_approval"
                      {...register('accessType')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">Pending Approval</span>
                      <p className="text-xs text-gray-500">Requires review before access is granted</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Access status:</span>
                {accessType === 'granted' ? (
                  <Badge variant="success">Access Granted</Badge>
                ) : (
                  <Badge variant="warning">Pending Approval</Badge>
                )}
              </div>

              {selectedCourse && (
                <div className="bg-indigo-50 rounded-lg px-4 py-3 text-sm text-indigo-800">
                  Course fee: <strong>₹{selectedCourse.fee.toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/students')}>
            Cancel
          </Button>
          <Button type="submit">Add Student</Button>
        </div>
      </form>
    </PageWrapper>
  )
}
