const express = require('express')
const controller = require('../controllers/lessonController')
const aiController = require('../controllers/aiController')
const { requireAuth, requireRole } = require('../middleware/auth')
const aiRateLimit = require('../middleware/aiRateLimit')
const validate = require('../middleware/validate')
const { objectIdParams } = require('../validators/schemas')

const router = express.Router()
router.get('/:id', requireAuth, requireRole('student', 'admin'), validate({ params: objectIdParams }), controller.getLesson)
router.post('/:id/start', requireAuth, requireRole('student'), validate({ params: objectIdParams }), controller.startLesson)
router.post('/:id/complete', requireAuth, requireRole('student'), validate({ params: objectIdParams }), controller.completeLesson)
router.post('/:id/ai-assistance', requireAuth, requireRole('student'), validate({ params: objectIdParams }), aiRateLimit, aiController.createLessonAssistance)
module.exports = router
