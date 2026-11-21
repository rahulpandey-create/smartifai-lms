const User = require('../models/User')
const Course = require('../models/Course')
const Enrollment = require('../models/Enrollment')
const Lesson = require('../models/Lesson')
const LessonProgress = require('../models/LessonProgress')
const AnalyticsEvent = require('../models/AnalyticsEvent')
const AppError = require('../middleware/AppError')
const { percentage, buildOrderedFunnel, buildLessonDropOff } = require('./analyticsMath')

const ACTIVE_EVENT_NAMES = new Set([
  'course_view', 'course_enrollment', 'lesson_start', 'lesson_complete', 'course_complete',
])


function getRange(query) {
  const today = new Date()
  const endDefault = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const startDefault = new Date(endDefault)
  startDefault.setUTCDate(startDefault.getUTCDate() - 29)
  const startDate = query.startDate || startDefault.toISOString().slice(0, 10)
  const endDate = query.endDate || endDefault.toISOString().slice(0, 10)
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const endExclusive = new Date(`${endDate}T00:00:00.000Z`)
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
  const days = Math.ceil((endExclusive - start) / 86_400_000)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(endExclusive.getTime()) || days < 1 || days > 366) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'Choose a valid date range of at most 366 days.')
  }
  if (start > new Date()) throw new AppError(400, 'INVALID_DATE_RANGE', 'startDate cannot be in the future.')
  return { start, endExclusive, startDate, endDate, days }
}

function datasetMatch(dataset) {
  if (dataset === 'demo') return { isDemo: true }
  if (dataset === 'live') return { isDemo: false }
  return {}
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}



async function getAnalytics(query) {
  const range = getRange(query)
  const dataMatch = datasetMatch(query.dataset)
  const todayUtc = new Date().toISOString().slice(0, 10)
  if (range.endDate > todayUtc) throw new AppError(400, 'INVALID_DATE_RANGE', 'endDate cannot be in the future.')
  const courseFilter = query.courseId ? { _id: query.courseId } : { isPublished: true }

  const [studentCount, students, courses, rangeEvents, allRangeEvents, periodEnrollments, allEnrollmentsAtEnd] = await Promise.all([
    User.countDocuments({ role: 'student', ...dataMatch }),
    User.find({ role: 'student', ...dataMatch }).select('_id').lean(),
    Course.find(courseFilter).select('title slug category').sort({ title: 1 }).lean(),
    AnalyticsEvent.find({
      ...dataMatch,
      occurredAt: { $gte: range.start, $lt: range.endExclusive },
      ...(query.courseId ? { courseId: query.courseId } : {}),
    }).sort({ occurredAt: 1 }).lean(),
    AnalyticsEvent.find({
      ...dataMatch,
      occurredAt: { $gte: range.start, $lt: range.endExclusive },
    }).sort({ occurredAt: 1 }).lean(),
    Enrollment.find({
      ...dataMatch,
      enrolledAt: { $gte: range.start, $lt: range.endExclusive },
      ...(query.courseId ? { course: query.courseId } : {}),
    }).select('student course enrolledAt completedAt').lean(),
    Enrollment.find({
      ...dataMatch,
      enrolledAt: { $lt: range.endExclusive },
      ...(query.courseId ? { course: query.courseId } : {}),
    }).select('student course enrolledAt completedAt').lean(),
  ])

  const studentIds = new Set(students.map((student) => student._id.toString()))
  const qualifyingEvents = rangeEvents.filter((event) =>
    event.actorId && studentIds.has(event.actorId.toString()) && ACTIVE_EVENT_NAMES.has(event.eventName),
  )
  const activeStudents = new Set(qualifyingEvents.map((event) => event.actorId.toString())).size

  const courseMap = new Map(courses.map((course) => [course._id.toString(), course]))
  const enrollmentsByCourse = new Map()
  const completedByCourse = new Map()
  for (const enrollment of allEnrollmentsAtEnd) {
    const key = enrollment.course.toString()
    enrollmentsByCourse.set(key, (enrollmentsByCourse.get(key) || 0) + 1)
    if (enrollment.completedAt && enrollment.completedAt < range.endExclusive) {
      completedByCourse.set(key, (completedByCourse.get(key) || 0) + 1)
    }
  }

  const periodCounts = new Map()
  for (const enrollment of periodEnrollments) {
    const key = enrollment.course.toString()
    periodCounts.set(key, (periodCounts.get(key) || 0) + 1)
  }

  const courseCompletion = courses.map((course) => {
    const key = course._id.toString()
    const total = enrollmentsByCourse.get(key) || 0
    const completed = completedByCourse.get(key) || 0
    return {
      courseId: key,
      courseTitle: course.title,
      enrollmentsInPeriod: periodCounts.get(key) || 0,
      totalEnrollmentsAsOfPeriodEnd: total,
      completedEnrollmentsAsOfPeriodEnd: completed,
      completionRate: percentage(completed, total),
    }
  })

  const popularCourses = [...periodCounts.entries()]
    .map(([courseId, count]) => ({ courseId, courseTitle: courseMap.get(courseId)?.title || 'Unknown course', enrollments: count }))
    .sort((a, b) => b.enrollments - a.enrollments || a.courseTitle.localeCompare(b.courseTitle))
    .slice(0, 5)

  const daily = new Map()
  for (let index = 0; index < range.days; index += 1) {
    const date = new Date(range.start)
    date.setUTCDate(date.getUTCDate() + index)
    const key = dayKey(date)
    daily.set(key, { date: key, activeStudents: new Set(), lessonCompletions: 0, pageViews: 0, courseViews: 0 })
  }
  for (const event of rangeEvents) {
    const day = daily.get(dayKey(event.occurredAt))
    if (!day) continue
    if (event.actorId && studentIds.has(event.actorId.toString()) && ACTIVE_EVENT_NAMES.has(event.eventName)) {
      day.activeStudents.add(event.actorId.toString())
    }
    if (event.eventName === 'lesson_complete') day.lessonCompletions += 1
  }
  for (const event of allRangeEvents) {
    const day = daily.get(dayKey(event.occurredAt))
    if (!day) continue
    if (event.eventName === 'page_view') day.pageViews += 1
    if (event.eventName === 'course_view' && (!query.courseId || event.courseId?.toString() === query.courseId)) day.courseViews += 1
  }
  const engagementTrend = [...daily.values()].map((day) => ({
    date: day.date,
    activeStudents: day.activeStudents.size,
    lessonCompletions: day.lessonCompletions,
  }))
  const trafficTrend = [...daily.values()].map((day) => ({
    date: day.date, pageViews: day.pageViews, courseViews: day.courseViews,
  }))

  const trafficEvents = allRangeEvents.filter((event) => event.eventName === 'page_view' || (event.eventName === 'course_view' && (!query.courseId || event.courseId?.toString() === query.courseId)))
  const sources = new Map()
  for (const event of trafficEvents) {
    const source = event.source || 'direct'
    const medium = event.medium || '(none)'
    const key = `${source}::${medium}`
    const item = sources.get(key) || { source, medium, views: 0 }
    item.views += 1
    sources.set(key, item)
  }
  const sourceBreakdown = [...sources.values()].sort((a, b) => b.views - a.views)

  const lessonCourseIds = courses.map((course) => course._id)
  const lessons = await Lesson.find({ course: { $in: lessonCourseIds } })
    .select('title order course').sort({ course: 1, order: 1 }).lean()
  // Completed lesson progress started in the same period must be subtracted from each lesson's starts.
  const startedRows = await LessonProgress.find({
    ...dataMatch,
    course: { $in: lessonCourseIds },
    startedAt: { $gte: range.start, $lt: range.endExclusive },
  }).select('student lesson completedAt').lean()
  const lessonDropOffFinal = buildLessonDropOff(lessons, startedRows, range.endExclusive, courseMap)

  let funnel = null
  if (query.courseId) {
    const funnelEvents = rangeEvents.filter((event) =>
      event.courseId?.toString() === query.courseId,
    )
    const steps = buildOrderedFunnel(funnelEvents, studentIds)
    funnel = {
      steps,
      note: 'Only authenticated students completing each stage in order within this date range are counted. Students entering the course before the period may be excluded.',
    }
  }

  const globalTotal = allEnrollmentsAtEnd.length
  const globalCompleted = allEnrollmentsAtEnd.filter((enrollment) => enrollment.completedAt && enrollment.completedAt < range.endExclusive).length

  return {
    filters: {
      startDate: range.startDate,
      endDate: range.endDate,
      timezone: 'UTC',
      courseId: query.courseId || null,
      dataset: query.dataset,
      datasetLabel: query.dataset === 'all' ? 'Synthetic demo data and live activity' : query.dataset === 'demo' ? 'Synthetic demo data only' : 'Live activity only',
    },
    summary: {
      registeredStudents: studentCount,
      registeredStudentsPeriod: 'all-time',
      activeStudents,
      courseEnrollments: periodEnrollments.length,
      overallCompletionRate: percentage(globalCompleted, globalTotal),
      totalEnrollmentsAsOfPeriodEnd: globalTotal,
      completedEnrollmentsAsOfPeriodEnd: globalCompleted,
    },
    courseCompletion,
    popularCourses,
    engagementTrend,
    lessonDropOff: lessonDropOffFinal,
    funnel,
    traffic: { daily: trafficTrend, sources: sourceBreakdown, totalViews: trafficEvents.length },
    metricNotes: {
      activeStudentEvents: [...ACTIVE_EVENT_NAMES],
      loginIsNotActiveEngagement: true,
      dateBoundary: 'startDate inclusive at 00:00 UTC; endDate inclusive through the end of that UTC day.',
      completionRate: 'Completed enrollments divided by all enrollments created before the exclusive period-end boundary.',
      lessonDropOff: 'Started within the period and not completed by period end; this is not permanent abandonment.',
      funnel: query.courseId ? funnel?.note : 'Select a course to calculate the ordered learning funnel.',
    },
  }
}

module.exports = { getAnalytics }
