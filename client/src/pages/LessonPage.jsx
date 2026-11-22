import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, post } from '../lib/api'
import { ErrorState, Loading, SuccessNotice } from '../components/Status'

export default function LessonPage() {
  const { id } = useParams()
  const [lesson, setLesson] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [assistance, setAssistance] = useState(null)
  const [completion, setCompletion] = useState(null)

  async function loadLesson() {
    setLoading(true)
    setError(null)
    try {
      const data = await api(`/lessons/${id}`)
      setLesson(data.lesson)
      setProgress(data.progress)
      await post(`/lessons/${id}/start`, {})
    } catch (err) { setError(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadLesson() }, [id])

  async function completeLesson() {
    setCompleting(true)
    setError(null)
    try {
      const data = await post(`/lessons/${id}/complete`, {})
      setProgress(data.data?.progress || data.progress)
      setCompletion(data.courseProgress)
    } catch (err) { setError(err) }
    finally { setCompleting(false) }
  }

  async function getSummary() {
    setAiLoading(true)
    setAiError('')
    setAssistance(null)
    try {
      const data = await post(`/lessons/${id}/ai-assistance`, {})
      setAssistance(data)
    } catch (err) { setAiError(err.message) }
    finally { setAiLoading(false) }
  }

  if (loading) return <Loading label="Opening lesson…" />
  if (error && !lesson) return <ErrorState error={error} onRetry={loadLesson} />
  if (!lesson) return null

  return (
    <article className="mx-auto max-w-3xl">
      <Link to={`/courses/${lesson.courseId}`} className="back-link"><ArrowLeft size={16} /> {lesson.courseTitle}</Link>
      <header className="lesson-heading mt-6">
        <div className="lesson-meta"><span>LESSON {lesson.order}</span><span className="lesson-meta-divider" aria-hidden="true" /> <span>{lesson.estimatedMinutes} min read</span></div>
        <h1 className="lesson-title mt-3">{lesson.title}</h1>
        <p className="lesson-intro">Work through the lesson at your own pace. You can generate a short recap and mark it complete when you’re ready.</p>
      </header>
      <section className="lesson-reading mt-7" aria-label="Lesson content">
        <div className="lesson-reading-label"><span className="lesson-reading-rule" />Lesson content</div>
        <div className="reading-card mt-3">
          {lesson.content.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </section>
      {error && <div className="mt-4"><ErrorState error={error} /></div>}
      <div className="lesson-progress mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center">
        <div><h2 className="font-semibold">Lesson progress</h2><p className="mt-1 text-sm text-ink-soft">{progress?.completedAt ? 'This lesson is marked complete.' : 'Mark this lesson complete when you are done.'}</p></div>
        <button className="button button-primary" onClick={completeLesson} disabled={completing || Boolean(progress?.completedAt)}>{progress?.completedAt ? <><CheckCircle2 size={17} /> Completed</> : completing ? 'Saving…' : <>Mark complete <CheckCircle2 size={17} /></>}</button>
      </div>
      {completion && <div className="mt-4"><SuccessNotice>Course progress: {completion.completedLessons} of {completion.totalLessons} lessons ({completion.percent}%). {completion.completed ? 'Course completed.' : ''}</SuccessNotice></div>}

      <section className="ai-panel mt-8" aria-labelledby="ai-summary-title">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="ai-icon"><Sparkles size={20} /></span><div><h2 id="ai-summary-title" className="font-bold">AI lesson summary</h2><p className="mt-1 text-sm text-ink-soft">Generate a concise summary and three key takeaways from this lesson.</p></div></div><button className="button button-secondary" onClick={getSummary} disabled={aiLoading}>{aiLoading ? 'Generating…' : 'Summarize lesson'} <Sparkles size={16} /></button></div>
        {aiError && <p className="form-error mt-4" role="alert">{aiError}</p>}
        {assistance && <div className="mt-5 border-t border-line pt-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700"><Sparkles size={14} /> {assistance.label}</div><p className="mt-3 leading-7">{assistance.assistance.summary}</p><h3 className="mt-4 text-sm font-bold">3 key takeaways</h3><ol className="takeaway-list mt-3">{assistance.assistance.key_points.map((point, index) => <li key={point}><span className="takeaway-number">{index + 1}</span><span>{point}</span></li>)}</ol><p className="mt-4 text-xs text-ink-soft">{assistance.disclaimer}</p></div>}
      </section>
      <div className="mt-8 flex justify-end"><Link to="/dashboard" className="back-link">Back to my learning <ArrowRight size={16} /></Link></div>
    </article>
  )
}
