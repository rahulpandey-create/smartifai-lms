const FUNNEL_STEPS = [
  { eventName: 'course_view', label: 'Course viewed' },
  { eventName: 'course_enrollment', label: 'Enrolled' },
  { eventName: 'lesson_start', label: 'Lesson started' },
  { eventName: 'lesson_complete', label: 'Lesson completed' },
]

function percentage(numerator, denominator) {
  if (!denominator) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function buildOrderedFunnel(events, studentIds) {
  const progressByStudent = new Map()
  const orderedEvents = [...events]
    .filter((event) => event.actorId && studentIds.has(event.actorId.toString()))
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))

  for (const event of orderedEvents) {
    const studentId = event.actorId.toString()
    const stage = progressByStudent.get(studentId) || 0
    const nextStep = FUNNEL_STEPS[stage]
    if (nextStep && event.eventName === nextStep.eventName) progressByStudent.set(studentId, stage + 1)
  }

  const counts = FUNNEL_STEPS.map((step, index) => ({
    step: step.label,
    eventName: step.eventName,
    students: [...progressByStudent.values()].filter((stage) => stage >= index + 1).length,
  }))

  return counts.map((step, index) => ({
    ...step,
    dropOffRate: index === counts.length - 1
      ? null
      : percentage(step.students - counts[index + 1].students, step.students),
  }))
}

function buildLessonDropOff(lessons, startedRows, endExclusive, courseMap) {
  const startsByLesson = new Map()
  const completedByEndByLesson = new Map()

  for (const row of startedRows) {
    const lessonId = row.lesson.toString()
    const studentId = row.student.toString()
    if (!startsByLesson.has(lessonId)) startsByLesson.set(lessonId, new Set())
    startsByLesson.get(lessonId).add(studentId)

    if (row.completedAt && row.completedAt < endExclusive) {
      if (!completedByEndByLesson.has(lessonId)) completedByEndByLesson.set(lessonId, new Set())
      completedByEndByLesson.get(lessonId).add(studentId)
    }
  }

  return lessons.map((lesson) => {
    const lessonId = lesson._id.toString()
    const starts = startsByLesson.get(lessonId) || new Set()
    const completed = completedByEndByLesson.get(lessonId) || new Set()
    const notCompleted = [...starts].filter((studentId) => !completed.has(studentId)).length
    const courseId = lesson.course.toString()
    return {
      lessonId,
      courseId,
      courseTitle: courseMap.get(courseId)?.title || 'Unknown course',
      lessonTitle: lesson.title,
      order: lesson.order,
      startedStudents: starts.size,
      notCompletedByPeriodEnd: notCompleted,
      dropOffRate: percentage(notCompleted, starts.size),
    }
  })
}

module.exports = { FUNNEL_STEPS, percentage, buildOrderedFunnel, buildLessonDropOff }
