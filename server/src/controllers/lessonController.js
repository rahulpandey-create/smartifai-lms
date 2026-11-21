const Lesson = require('../models/Lesson')
const Enrollment = require('../models/Enrollment')
const LessonProgress = require('../models/LessonProgress')
const AppError = require('../middleware/AppError')
const { recordEvent } = require('../services/eventService')

async function getAuthorizedLesson(req, lessonId) {
  const lesson = await Lesson.findById(lessonId).populate('course', 'title slug')
  if (!lesson) throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found.')
  if (req.user.role === 'admin') return { lesson, enrollment: null }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: lesson.course._id })
  if (!enrollment) throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Enroll in this course to access its lessons.')
  return { lesson, enrollment }
}

async function getLesson(req, res) {
  const { lesson } = await getAuthorizedLesson(req, req.params.id)
  const progress = req.user.role === 'student'
    ? await LessonProgress.findOne({ student: req.user._id, lesson: lesson._id }).select('startedAt completedAt')
    : null
  return res.json({
    success: true,
    data: {
      lesson: {
        id: lesson._id.toString(), courseId: lesson.course._id.toString(),
        courseTitle: lesson.course.title, courseSlug: lesson.course.slug,
        title: lesson.title, order: lesson.order, content: lesson.content,
        estimatedMinutes: lesson.estimatedMinutes,
      },
      progress: progress ? { startedAt: progress.startedAt, completedAt: progress.completedAt } : null,
    },
  })
}

async function ensureProgress(req, lesson, enrollment) {
  const now = new Date()
  let progress = await LessonProgress.findOne({ enrollment: enrollment._id, lesson: lesson._id })
  let started = false

  if (!progress) {
    try {
      progress = await LessonProgress.create({
        enrollment: enrollment._id, student: req.user._id,
        course: lesson.course._id || lesson.course, lesson: lesson._id,
        startedAt: now, isDemo: req.user.isDemo,
      })
      started = true
    } catch (error) {
      if (error.code !== 11000) throw error
      progress = await LessonProgress.findOne({ enrollment: enrollment._id, lesson: lesson._id })
    }
  } else if (!progress.startedAt) {
    progress.startedAt = now
    await progress.save()
    started = true
  }

  if (started) {
    await recordEvent({
      eventName: 'lesson_start', actorId: req.user._id, sessionId: req.sessionId,
      courseId: lesson.course._id || lesson.course, lessonId: lesson._id,
      enrollmentId: enrollment._id, pagePath: `/lessons/${lesson._id}`,
      isDemo: req.user.isDemo, dedupeKey: `lesson-start:${enrollment._id}:${lesson._id}`,
    })
  }
  return progress
}

async function startLesson(req, res) {
  const { lesson, enrollment } = await getAuthorizedLesson(req, req.params.id)
  if (!enrollment) throw new AppError(403, 'STUDENT_ONLY', 'Only enrolled students can start lessons.')
  const progress = await ensureProgress(req, lesson, enrollment)
  return res.json({
    success: true,
    data: { progress: { lessonId: lesson._id.toString(), startedAt: progress.startedAt, completedAt: progress.completedAt } },
  })
}

async function completeLesson(req, res) {
  const { lesson, enrollment } = await getAuthorizedLesson(req, req.params.id)
  if (!enrollment) throw new AppError(403, 'STUDENT_ONLY', 'Only enrolled students can complete lessons.')
  let progress = await ensureProgress(req, lesson, enrollment)
  let newlyCompleted = false

  if (!progress.completedAt) {
    progress.completedAt = new Date()
    await progress.save()
    newlyCompleted = true
    await recordEvent({
      eventName: 'lesson_complete', actorId: req.user._id, sessionId: req.sessionId,
      courseId: lesson.course._id || lesson.course, lessonId: lesson._id,
      enrollmentId: enrollment._id, pagePath: `/lessons/${lesson._id}`,
      isDemo: req.user.isDemo, dedupeKey: `lesson-complete:${enrollment._id}:${lesson._id}`,
    })
  }

  const [completedLessons, totalLessons] = await Promise.all([
    LessonProgress.countDocuments({ enrollment: enrollment._id, completedAt: { $ne: null } }),
    Lesson.countDocuments({ course: lesson.course._id || lesson.course }),
  ])

  let courseCompletedNow = false
  if (totalLessons > 0 && completedLessons === totalLessons && !enrollment.completedAt) {
    const updated = await Enrollment.findOneAndUpdate(
      { _id: enrollment._id, completedAt: null },
      { $set: { completedAt: new Date() } },
      { new: true },
    )
    if (updated) {
      enrollment.completedAt = updated.completedAt
      courseCompletedNow = true
      await recordEvent({
        eventName: 'course_complete', actorId: req.user._id, sessionId: req.sessionId,
        courseId: lesson.course._id || lesson.course, enrollmentId: enrollment._id,
        pagePath: `/courses/${lesson.course._id || lesson.course}`,
        isDemo: req.user.isDemo, dedupeKey: `course-complete:${enrollment._id}`,
      })
    }
  }

  progress = await LessonProgress.findById(progress._id)
  return res.json({
    success: true,
    data: {
      progress: { lessonId: lesson._id.toString(), startedAt: progress.startedAt, completedAt: progress.completedAt },
      courseProgress: {
        completedLessons, totalLessons,
        percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
        completed: Boolean(enrollment.completedAt),
      },
      newlyCompleted,
      courseCompletedNow,
    },
  })
}

module.exports = { getLesson, startLesson, completeLesson }
