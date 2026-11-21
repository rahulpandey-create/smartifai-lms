import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../components/Status'

const activityLabels = {
  course_enrollment: 'Enrolled in a course',
  lesson_start: 'Started a lesson',
  lesson_complete: 'Completed a lesson',
  course_complete: 'Completed a course',
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try { setDashboard(await api('/me/dashboard')) }
    catch (err) { setError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadDashboard() }, [])

  if (loading) return <Loading label="Loading your learning dashboard…" />
  if (error) return <ErrorState error={error} onRetry={loadDashboard} />

  const summary = dashboard.summary
  return (
    <section>
      <div className="section-kicker">STUDENT SPACE / OVERVIEW</div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="page-title">Your learning <span>dashboard.</span></h1><p className="page-subtitle">A clear view of what you have learned and what comes next.</p></div><Link to="/courses" className="button button-primary">Explore courses <ArrowRight size={17} /></Link></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-card"><span className="metric-icon"><GraduationCap size={19} /></span><span className="metric-label">Enrolled courses</span><strong>{summary.enrolledCourseCount}</strong><span className="metric-note">Your active learning paths</span></div>
        <div className="metric-card"><span className="metric-icon"><CheckCircle2 size={19} /></span><span className="metric-label">Completed courses</span><strong>{summary.completedCourseCount}</strong><span className="metric-note">Courses with every lesson complete</span></div>
        <div className="metric-card"><span className="metric-icon"><TrendingUp size={19} /></span><span className="metric-label">In progress</span><strong>{summary.inProgressCourseCount}</strong><span className="metric-note">Keep building momentum</span></div>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
        <div><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Continue learning</h2><span className="text-xs text-ink-soft">{dashboard.enrollments.length} enrolled</span></div>
          {dashboard.enrollments.length === 0 ? <EmptyState title="Your learning starts here">You have not enrolled in a course yet. Browse the catalog and choose a course to get started.</EmptyState> : (
            <div className="space-y-4">{dashboard.enrollments.map((item) => (
              <article key={item.enrollmentId} className="learning-card">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><span className="pill">{item.course.category}</span><h3 className="mt-2 text-lg font-bold">{item.course.title}</h3><p className="mt-1 text-xs text-ink-soft">Enrolled {formatDate(item.enrolledAt)}</p></div><span className={`progress-percent${item.completedAt ? ' progress-done' : ''}`}>{item.progressPercent}%</span></div>
                <div className="progress-track mt-4"><span style={{ width: `${item.progressPercent}%` }} /></div>
                <div className="mt-3 flex flex-col justify-between gap-3 text-xs text-ink-soft sm:flex-row sm:items-center"><span>{item.completedLessons} of {item.totalLessons} lessons completed</span>{item.nextLesson ? <Link className="inline-flex items-center gap-1 font-semibold text-brand-700" to={`/lessons/${item.nextLesson.id}`}>Continue: {item.nextLesson.title} <ArrowRight size={14} /></Link> : <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 size={14} /> Course complete</span>}</div>
              </article>
            ))}</div>
          )}
        </div>
        <aside><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Recent activity</h2><Clock3 size={17} className="text-ink-soft" /></div>
          <div className="activity-card">{dashboard.recentActivities.length === 0 ? <EmptyState title="No activity yet">Your learning activity will appear here after you view, start, or complete course content.</EmptyState> : <ol className="divide-y divide-line">{dashboard.recentActivities.map((activity) => <li key={activity.id} className="flex gap-3 py-4 first:pt-1 last:pb-1"><span className="activity-dot" /><div className="min-w-0"><p className="text-sm font-semibold">{activityLabels[activity.eventName] || activity.eventName}</p><p className="mt-1 truncate text-xs text-ink-soft">{activity.lessonTitle || activity.courseTitle || 'Learning activity'}</p><time className="mt-1 block text-[11px] text-ink-soft">{formatDate(activity.occurredAt)}</time></div></li>)}</ol>}</div>
        </aside>
      </div>
      <p className="mt-8 text-xs text-ink-soft">Progress is calculated from distinct completed lessons divided by the total lessons in each course. Self-reported completion does not prove mastery.</p>
    </section>
  )
}
