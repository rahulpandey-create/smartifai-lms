const Lesson = require('../models/Lesson')
const Enrollment = require('../models/Enrollment')
const AppError = require('../middleware/AppError')
const { summarizeLesson } = require('../services/aiService')

async function createLessonAssistance(req, res) {
  const lesson = await Lesson.findById(req.params.id)
  if (!lesson) throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found.')

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: lesson.course })
  if (!enrollment) throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Enroll in this course to use lesson assistance.')

  try {
    const result = await summarizeLesson({ title: lesson.title, content: lesson.content })
    return res.json({
      success: true,
      data: {
        feature: 'lesson_summary',
        label: 'AI-generated summary',
        disclaimer: 'AI-generated and may contain inaccuracies. Check the original lesson for authoritative details.',
        assistance: result,
      },
    })
  } catch (error) {
    if (error.code === 'AI_NOT_CONFIGURED') {
      throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI summaries are not configured. Add GEMINI_API_KEY to the server environment.')
    }
    if (error.code === 'AI_INVALID_RESPONSE') {
      throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI service returned an invalid summary. Please try again.')
    }
    if (error.name === 'RequestTimeoutError' || /timeout|abort/i.test(error.message || '')) {
      throw new AppError(504, 'AI_TIMEOUT', 'The AI service took too long to respond. Please try again.')
    }
    console.error('[ai] provider request failed:', error.message)
    throw new AppError(502, 'AI_PROVIDER_ERROR', 'The AI service is temporarily unavailable. Please try again later.')
  }
}

module.exports = { createLessonAssistance }
