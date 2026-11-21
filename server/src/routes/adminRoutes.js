const express = require('express')
const { analytics } = require('../controllers/adminController')
const { requireAuth, requireRole } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { analyticsQuery } = require('../validators/schemas')

const router = express.Router()
router.get('/analytics', requireAuth, requireRole('admin'), validate({ query: analyticsQuery }), analytics)
module.exports = router
