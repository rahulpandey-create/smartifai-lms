const Course = require('../models/Course')
const Lesson = require('../models/Lesson')
const Enrollment = require('../models/Enrollment')
const AppError = require('../middleware/AppError')
const { recordEvent } = require('../services/eventService')

async function listCourses(req, res) {
  const courses = await Course.find({ isPublished: true }).sort({ createdAt: 1 }).lean()
  const courseIds = courses.map((course) => course._id)
  const lessonCounts = await Lesson.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ])
  const counts = new Map(lessonCounts.map((item) => [item._id.toString(), item.count]))
  return res.json({
    success: true,
    data: {
      courses: courses.map((course) => ({
        id: course._id.toString(), title: course.title, slug: course.slug,
        description: course.description, category: course.category,
        level: course.level, estimatedMinutes: course.estimatedMinutes,
        lessonCount: counts.get(course._id.toString()) || 0,
      })),
    },
  })
}

async function getCourse(req, res) {
  const course = await Course.findOne({ _id: req.params.id, isPublished: true }).lean()
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found.')

  const [lessons, enrollment] = await Promise.all([
    Lesson.find({ course: course._id }).sort({ order: 1 }).select('title order estimatedMinutes').lean(),
    req.user?.role === 'student'
      ? Enrollment.findOne({ student: req.user._id, course: course._id }).select('_id completedAt')
      : Promise.resolve(null),
  ])

  return res.json({
    success: true,
    data: {
      course: {
        id: course._id.toString(), title: course.title, slug: course.slug,
        description: course.description, category: course.category, level: course.level,
        estimatedMinutes: course.estimatedMinutes,
        lessons: lessons.map((lesson) => ({
          id: lesson._id.toString(), title: lesson.title, order: lesson.order,
          estimatedMinutes: lesson.estimatedMinutes,
        })),
        enrollment: enrollment ? { id: enrollment._id.toString(), completed: Boolean(enrollment.completedAt) } : null,
      },
    },
  })
}

async function enroll(req, res) {
  if (req.user.role !== 'student') throw new AppError(403, 'STUDENT_ONLY', 'Only students can enroll in courses.')
  const course = await Course.findOne({ _id: req.params.id, isPublished: true })
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found.')

  let enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id })
  let created = false
  if (!enrollment) {
    try {
      enrollment = await Enrollment.create({
        student: req.user._id, course: course._id, enrolledAt: new Date(), isDemo: req.user.isDemo,
      })
      created = true
    } catch (error) {
      if (error.code !== 11000) throw error
      enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id })
    }
  }

  if (created) {
    await recordEvent({
      eventName: 'course_enrollment', actorId: req.user._id, sessionId: req.sessionId,
      courseId: course._id, enrollmentId: enrollment._id,
      pagePath: `/courses/${course._id}`, isDemo: req.user.isDemo,
      dedupeKey: `enrollment:${enrollment._id}`,
    })
  }

  return res.status(created ? 201 : 200).json({
    success: true,
    data: {
      enrollment: {
        id: enrollment._id.toString(), courseId: course._id.toString(),
        enrolledAt: enrollment.enrolledAt, completedAt: enrollment.completedAt,
      },
      alreadyEnrolled: !created,
    },
  })
}

module.exports = { listCourses, getCourse, enroll }
