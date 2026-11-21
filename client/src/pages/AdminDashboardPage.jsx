import { useEffect, useState } from 'react'
import { Activity, CalendarDays, GraduationCap, RefreshCw, Users } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../lib/api'
import { ErrorState, Loading } from '../components/Status'

function dateString(date) { return date.toISOString().slice(0, 10) }
function dateOffset(days) { const date = new Date(); date.setUTCDate(date.getUTCDate() - days); return dateString(date) }
function formatNumber(value) { return new Intl.NumberFormat().format(value || 0) }
function formatPercent(value) { return value === null ? 'N/A' : `${value}%` }

function Metric({ icon: Icon, label, value, note }) {
  return <article className="metric-card"><span className="metric-icon"><Icon size={19} /></span><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-note">{note}</span></article>
}

function ChartCard({ title, description, children }) {
  return <section className="chart-card"><div className="mb-4"><h2 className="text-base font-bold">{title}</h2><p className="mt-1 text-xs text-ink-soft">{description}</p></div><div className="chart-wrap">{children}</div></section>
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState({ startDate: dateOffset(29), endDate: dateString(new Date()), courseId: '', dataset: 'all' })
  const [courses, setCourses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api('/courses').then((data) => setCourses(data.courses)).catch(() => {})
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate, dataset: filters.dataset })
    if (filters.courseId) params.set('courseId', filters.courseId)
    try { setAnalytics(await api(`/admin/analytics?${params.toString()}`)) }
    catch (err) { setError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAnalytics() }, [filters.startDate, filters.endDate, filters.courseId, filters.dataset])

  function updateFilter(event) { setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) }

  return (
    <section>
      <div className="section-kicker">ADMIN / STUDENT SUCCESS INSIGHTS</div>
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="page-title">Engagement <span>overview.</span></h1><p className="page-subtitle">Understand course participation, progress, and learning activity.</p></div><button className="button button-secondary button-small" onClick={loadAnalytics}><RefreshCw size={15} /> Refresh metrics</button></div>

      <div className="filter-panel">
        <label className="field-label">From<input className="field-input" type="date" name="startDate" value={filters.startDate} onChange={updateFilter} /></label>
        <label className="field-label">To<input className="field-input" type="date" name="endDate" value={filters.endDate} onChange={updateFilter} /></label>
        <label className="field-label">Course<select className="field-input" name="courseId" value={filters.courseId} onChange={updateFilter}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label className="field-label">Data source<select className="field-input" name="dataset" value={filters.dataset} onChange={updateFilter}><option value="all">Demo + live activity</option><option value="demo">Synthetic demo only</option><option value="live">Live activity only</option></select></label>
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-ink-soft"><CalendarDays size={13} /> Dates are interpreted in UTC, inclusive of the selected end date. {analytics?.filters?.datasetLabel || ''}</p>

      {loading && <div className="mt-6"><Loading label="Calculating analytics…" /></div>}
      {error && <div className="mt-6"><ErrorState error={error} onRetry={loadAnalytics} /></div>}
      {analytics && !loading && !error && <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Registered students" value={formatNumber(analytics.summary.registeredStudents)} note="All-time student accounts" />
          <Metric icon={Activity} label="Active students" value={formatNumber(analytics.summary.activeStudents)} note="Distinct students with learning events" />
          <Metric icon={GraduationCap} label="Course enrollments" value={formatNumber(analytics.summary.courseEnrollments)} note="Created in selected period" />
          <Metric icon={Activity} label="Overall completion" value={formatPercent(analytics.summary.overallCompletionRate)} note="Completed / total as of period end" />
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          <ChartCard title="Engagement trend" description="Daily active students and lesson completions.">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.engagementTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} minTickGap={22} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="activeStudents" name="Active students" stroke="#ea580c" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="lessonCompletions" name="Lesson completions" stroke="#2563eb" strokeWidth={2.2} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Popular courses" description="Ranked by enrollments created during this period.">
            {analytics.popularCourses.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.popularCourses} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 12 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="courseTitle" width={130} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="enrollments" name="New enrollments" fill="#ea580c" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer> : <p className="chart-empty">No enrollments in this period.</p>}
          </ChartCard>
          <ChartCard title="Traffic & navigation" description="Page views and course views by day.">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.traffic.daily} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} minTickGap={22} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="pageViews" name="Page views" stroke="#0f766e" strokeWidth={2.3} dot={false} /><Line type="monotone" dataKey="courseViews" name="Course views" stroke="#7c3aed" strokeWidth={2.3} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Traffic sources" description={`Views recorded: ${formatNumber(analytics.traffic.totalViews)}. Source and medium are client-attributed.`}>
            {analytics.traffic.sources.length ? <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Source</th><th>Medium</th><th className="text-right">Views</th></tr></thead><tbody>{analytics.traffic.sources.map((row) => <tr key={`${row.source}-${row.medium}`}><td>{row.source}</td><td>{row.medium}</td><td className="text-right font-semibold">{formatNumber(row.views)}</td></tr>)}</tbody></table></div> : <p className="chart-empty">No navigation views in this period.</p>}
          </ChartCard>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="chart-card"><div className="mb-4"><h2 className="text-base font-bold">Course completion snapshot</h2><p className="mt-1 text-xs text-ink-soft">All enrollments created before the selected period-end boundary.</p></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Course</th><th className="text-right">New enrollments</th><th className="text-right">Completed / total</th><th className="text-right">Rate</th></tr></thead><tbody>{analytics.courseCompletion.map((row) => <tr key={row.courseId}><td className="font-medium">{row.courseTitle}</td><td className="text-right">{formatNumber(row.enrollmentsInPeriod)}</td><td className="text-right">{row.completedEnrollmentsAsOfPeriodEnd} / {row.totalEnrollmentsAsOfPeriodEnd}</td><td className="text-right font-semibold">{formatPercent(row.completionRate)}</td></tr>)}</tbody></table></div></section>
          <section className="chart-card"><div className="mb-4"><h2 className="text-base font-bold">Learning funnel</h2><p className="mt-1 text-xs text-ink-soft">Authenticated students completing steps in order.</p></div>
            {!analytics.funnel ? <div className="chart-empty">Select a course above to calculate its funnel.</div> : <div className="space-y-3">{analytics.funnel.steps.map((step, index) => <div key={step.eventName}><div className="flex items-center justify-between gap-2 text-sm"><span className="font-medium">{index + 1}. {step.step}</span><strong>{formatNumber(step.students)}</strong></div><div className="funnel-track"><span style={{ width: `${analytics.funnel.steps[0].students ? (step.students / analytics.funnel.steps[0].students) * 100 : 0}%` }} /></div>{index < analytics.funnel.steps.length - 1 && <p className="mt-1 text-right text-[11px] text-ink-soft">Step drop-off: {formatPercent(step.dropOffRate)}</p>}</div>)}<p className="pt-2 text-[11px] leading-5 text-ink-soft">{analytics.funnel.note}</p></div>}
          </section>
        </div>

        <section className="chart-card mt-7"><div className="mb-4"><h2 className="text-base font-bold">Lesson drop-off</h2><p className="mt-1 text-xs text-ink-soft">Students who started in the period and had not completed by period end. This is not permanent abandonment.</p></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Course</th><th>Lesson</th><th className="text-right">Started</th><th className="text-right">Not completed by period end</th><th className="text-right">Drop-off</th></tr></thead><tbody>{analytics.lessonDropOff.map((row) => <tr key={row.lessonId}><td>{row.courseTitle}</td><td>{row.order}. {row.lessonTitle}</td><td className="text-right">{row.startedStudents}</td><td className="text-right">{row.notCompletedByPeriodEnd}</td><td className="text-right font-semibold">{formatPercent(row.dropOffRate)}</td></tr>)}</tbody></table>{analytics.lessonDropOff.length === 0 && <p className="chart-empty">No lesson starts were recorded in this period.</p>}</div></section>

        <div className="mt-5 rounded-xl border border-line bg-white/70 p-4 text-xs leading-5 text-ink-soft"><strong className="text-ink">Metric definitions:</strong> Active students are distinct students with course view, enrollment, lesson start, lesson completion, or course completion events; login and page views alone do not qualify. Funnel counts are a distinct-student ordered sequence. Completion rate is a period-end snapshot. {analytics.metricNotes.dateBoundary}</div>
      </>}
    </section>
  )
}
