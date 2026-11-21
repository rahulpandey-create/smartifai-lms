const express = require('express')
const controller = require('../controllers/courseController')
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { courseIdParams } = require('../validators/schemas')

const router = express.Router()
router.get('/', controller.listCourses)
router.get('/:id', optionalAuth, validate({ params: courseIdParams }), controller.getCourse)
router.post('/:id/enroll', requireAuth, requireRole('student'), validate({ params: courseIdParams }), controller.enroll)
module.exports = router
