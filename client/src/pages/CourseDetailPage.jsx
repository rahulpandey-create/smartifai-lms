import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Clock3, LockKeyhole } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, post, recordEvent } from '../lib/api'
import { EmptyState, ErrorState, Loading, SuccessNotice } from '../components/Status'

export default function CourseDetailPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadCourse() {
    setLoading(true)
    setError(null)
    try {
      const data = await api(`/courses/${id}`)
      setCourse(data.course)
    } catch (err) { setError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!authLoading) loadCourse()
  }, [id, user?.id, authLoading])
  useEffect(() => {
    // Wait for session restoration so enrolled students' course views retain their actor ID.
    if (!authLoading && course?.id === id) {
      recordEvent({ eventName: 'course_view', pagePath: `/courses/${id}`, courseId: id })
    }
  }, [course?.id, id, authLoading, user?.id])

  async function enroll() {
    setEnrolling(true)
    setNotice('')
    try {
      const result = await post(`/courses/${id}/enroll`, {})
      setNotice(result.alreadyEnrolled ? 'You are already enrolled in this course.' : 'You are enrolled. Your lessons are now available.')
      await loadCourse()
    } catch (err) { setError(err) }
    finally { setEnrolling(false) }
  }

  if (loading) return <Loading label="Loading course…" />
  if (error) return <ErrorState error={error} onRetry={loadCourse} />
  if (!course) return <EmptyState title="Course not found">This course may no longer be available.</EmptyState>

  const enrolled = Boolean(course.enrollment) && user?.role === 'student'
  return (
    <section className="mx-auto max-w-4xl">
      <Link to="/courses" className="back-link"><ArrowLeft size={16} /> All courses</Link>
      <div className="detail-hero mt-5">
        <div className="relative z-10 max-w-2xl"><div className="mb-4 flex flex-wrap gap-2"><span className="pill pill-light">{course.category}</span><span className="pill pill-light">{course.level}</span></div><h1 className="text-3xl font-bold leading-tight sm:text-4xl">{course.title}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-orange-50/90">{course.description}</p><div className="mt-6 flex flex-wrap gap-5 text-sm text-orange-50"><span className="inline-flex items-center gap-2"><BookOpen size={16} /> {course.lessons.length} lessons</span><span className="inline-flex items-center gap-2"><Clock3 size={16} /> {course.estimatedMinutes} minutes</span></div></div>
      </div>
      {notice && <div className="mt-5"><SuccessNotice>{notice}</SuccessNotice></div>}
      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">Course lessons</h2><p className="mt-1 text-sm text-ink-soft">Lessons are ordered. Complete each one to track your progress.</p></div>
        {user?.role === 'student' && !enrolled && <button className="button button-primary" disabled={enrolling} onClick={enroll}>{enrolling ? 'Enrolling…' : 'Enroll in course'}</button>}
        {!user && <Link to="/login" className="button button-primary">Sign in to enroll</Link>}
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {course.lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center gap-4 border-b border-line p-4 last:border-b-0 sm:p-5">
            <span className="lesson-number">{String(lesson.order).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1"><h3 className="font-semibold">{lesson.title}</h3><p className="mt-1 text-xs text-ink-soft">Lesson {lesson.order} · {lesson.estimatedMinutes} min</p></div>
            {enrolled ? <Link className="button button-secondary button-small" to={`/lessons/${lesson.id}`}>Open lesson <ArrowLeft className="rotate-180" size={15} /></Link>
              : <span className="inline-flex items-center gap-1 text-xs text-ink-soft"><LockKeyhole size={14} /> Enroll to unlock</span>}
          </div>
        ))}
        {course.lessons.length === 0 && <div className="p-6"><EmptyState title="No lessons available">Lessons have not been added to this course.</EmptyState></div>}
      </div>
      {user?.role === 'admin' && <p className="mt-4 text-xs text-ink-soft">Admin preview: student enrollment is required to track lesson progress.</p>}
      {enrolled && course.enrollment.completed && <div className="mt-4"><SuccessNotice>You have completed this course.</SuccessNotice></div>}
    </section>
  )
}
