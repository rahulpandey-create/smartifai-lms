const express = require('express')
const { getStudentDashboard } = require('../controllers/dashboardController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.get('/', requireAuth, requireRole('student'), getStudentDashboard)
module.exports = router
