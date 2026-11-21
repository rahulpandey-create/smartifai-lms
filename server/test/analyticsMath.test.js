const test = require('node:test')
const assert = require('node:assert/strict')
const { percentage, buildOrderedFunnel, buildLessonDropOff } = require('../src/services/analyticsMath')

const date = (value) => new Date(value)

test('completion percentages use numerator / denominator and return N/A for zero denominator', () => {
  assert.equal(percentage(2, 3), 66.7)
  assert.equal(percentage(3, 3), 100)
  assert.equal(percentage(0, 0), null)
})

test('funnel counts distinct authenticated students in strict event order and keeps later stages as subsets', () => {
  const ids = new Set(['student-a', 'student-b', 'student-c'])
  const events = [
    { actorId: 'student-a', eventName: 'lesson_complete', occurredAt: date('2026-11-04T12:00:00Z') },
    { actorId: 'student-a', eventName: 'course_view', occurredAt: date('2026-11-01T09:00:00Z') },
    { actorId: 'student-a', eventName: 'course_enrollment', occurredAt: date('2026-11-02T09:00:00Z') },
    { actorId: 'student-a', eventName: 'lesson_start', occurredAt: date('2026-11-03T09:00:00Z') },
    { actorId: 'student-b', eventName: 'course_view', occurredAt: date('2026-11-01T10:00:00Z') },
    { actorId: 'student-b', eventName: 'course_enrollment', occurredAt: date('2026-11-02T10:00:00Z') },
    { actorId: 'student-b', eventName: 'lesson_complete', occurredAt: date('2026-11-04T10:00:00Z') },
    { actorId: 'student-c', eventName: 'course_enrollment', occurredAt: date('2026-11-01T08:00:00Z') },
    { actorId: 'admin-user', eventName: 'course_view', occurredAt: date('2026-11-01T07:00:00Z') },
  ]

  const funnel = buildOrderedFunnel(events, ids)
  assert.deepEqual(funnel.map((step) => step.students), [2, 2, 1, 1])
  assert.equal(funnel[0].dropOffRate, 0)
  assert.equal(funnel[1].dropOffRate, 50)
  assert.equal(funnel[2].dropOffRate, 0)
  assert.equal(funnel[3].dropOffRate, null)
})

test('lesson drop-off counts started students without completion by the selected period end', () => {
  const endExclusive = date('2026-11-10T00:00:00Z')
  const lessons = [{ _id: 'lesson-1', course: 'course-1', title: 'Lesson 1', order: 1 }]
  const courseMap = new Map([['course-1', { title: 'Course 1' }]])
  const rows = [
    { student: 'student-a', lesson: 'lesson-1', completedAt: date('2026-11-08T10:00:00Z') },
    { student: 'student-b', lesson: 'lesson-1', completedAt: date('2026-11-11T10:00:00Z') },
    { student: 'student-c', lesson: 'lesson-1', completedAt: null },
    { student: 'student-c', lesson: 'lesson-1', completedAt: null },
  ]

  const [row] = buildLessonDropOff(lessons, rows, endExclusive, courseMap)
  assert.equal(row.startedStudents, 3)
  assert.equal(row.notCompletedByPeriodEnd, 2)
  assert.equal(row.dropOffRate, 66.7)
  assert.equal(row.courseTitle, 'Course 1')
})
