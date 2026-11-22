import { useEffect, useState } from 'react'
import { ArrowUpRight, Clock3, Layers3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { EmptyState, ErrorState, Loading } from '../components/Status'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadCourses() {
    setLoading(true)
    setError(null)
    try {
      const data = await api('/courses')
      setCourses(data.courses)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCourses() }, [])

  return (
    <section>
      <div className="section-kicker">SMARRTIFAI LEARN / COURSE CATALOG</div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="page-title">Build skills that <span>move you forward.</span></h1><p className="page-subtitle">Explore short, structured courses and learn at your own pace.</p></div>
        <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-soft"><strong className="text-ink">{courses.length}</strong> available courses</div>
      </div>
      {loading && <Loading label="Loading courses…" />}
      {error && <ErrorState error={error} onRetry={loadCourses} />}
      {!loading && !error && courses.length === 0 && <EmptyState title="No courses yet">Seed the demo courses to populate the catalog.</EmptyState>}
      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course, index) => (
            <article key={course.id} className="course-card">
              <div className={`course-visual course-visual-${index % 2}`}><span>{String(index + 1).padStart(2, '0')}</span><Layers3 size={42} strokeWidth={1.4} /></div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2"><span className="pill">{course.category}</span><span className="text-xs text-ink-soft">{course.level}</span></div>
                <h2 className="text-xl font-bold tracking-tight">{course.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{course.description}</p>
                <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <div className="flex gap-4 text-xs text-ink-soft"><span className="inline-flex items-center gap-1"><Layers3 size={14} /> {course.lessonCount} lessons</span><span className="inline-flex items-center gap-1"><Clock3 size={14} /> {course.estimatedMinutes} min</span></div>
                  <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">Explore <ArrowUpRight size={16} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
