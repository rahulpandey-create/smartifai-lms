const Enrollment = require('../models/Enrollment')
const Lesson = require('../models/Lesson')
const LessonProgress = require('../models/LessonProgress')
const AnalyticsEvent = require('../models/AnalyticsEvent')

async function getStudentDashboard(req, res) {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course', 'title slug description category level estimatedMinutes')
    .sort({ enrolledAt: -1 })

  const enrollmentCards = await Promise.all(enrollments.map(async (enrollment) => {
    const [lessons, progress] = await Promise.all([
      Lesson.find({ course: enrollment.course._id }).sort({ order: 1 }).select('title order').lean(),
      LessonProgress.find({ enrollment: enrollment._id }).select('lesson startedAt completedAt').lean(),
    ])
    const progressByLesson = new Map(progress.map((row) => [row.lesson.toString(), row]))
    const completedLessons = progress.filter((row) => Boolean(row.completedAt)).length
    const nextLesson = lessons.find((lesson) => !progressByLesson.get(lesson._id.toString())?.completedAt)
    return {
      enrollmentId: enrollment._id.toString(),
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      course: {
        id: enrollment.course._id.toString(), title: enrollment.course.title,
        slug: enrollment.course.slug, description: enrollment.course.description,
        category: enrollment.course.category, level: enrollment.course.level,
      },
      completedLessons,
      totalLessons: lessons.length,
      progressPercent: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
      nextLesson: nextLesson ? { id: nextLesson._id.toString(), title: nextLesson.title, order: nextLesson.order } : null,
      lessons: lessons.map((lesson) => ({
        id: lesson._id.toString(), title: lesson.title, order: lesson.order,
        startedAt: progressByLesson.get(lesson._id.toString())?.startedAt || null,
        completedAt: progressByLesson.get(lesson._id.toString())?.completedAt || null,
      })),
    }
  }))

  const activities = await AnalyticsEvent.find({
    actorId: req.user._id,
    eventName: { $in: ['course_enrollment', 'lesson_start', 'lesson_complete', 'course_complete'] },
  })
    .sort({ occurredAt: -1 }).limit(5)
    .populate('courseId', 'title')
    .populate('lessonId', 'title')
    .lean()

  const completedCourseCount = enrollments.filter((item) => Boolean(item.completedAt)).length
  return res.json({
    success: true,
    data: {
      summary: {
        enrolledCourseCount: enrollments.length,
        completedCourseCount,
        inProgressCourseCount: enrollments.length - completedCourseCount,
      },
      enrollments: enrollmentCards,
      recentActivities: activities.map((event) => ({
        id: event.eventId, eventName: event.eventName, occurredAt: event.occurredAt,
        courseTitle: event.courseId?.title || null, lessonTitle: event.lessonId?.title || null,
      })),
    },
  })
}

module.exports = { getStudentDashboard }
