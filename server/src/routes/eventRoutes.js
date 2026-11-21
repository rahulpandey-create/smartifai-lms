const express = require('express')
const { rateLimit } = require('express-rate-limit')
const { ingestNavigationEvent } = require('../controllers/eventController')
const { optionalAuth } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { navigationEventBody } = require('../validators/schemas')

const router = express.Router()
const eventLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'EVENT_RATE_LIMITED', message: 'Too many analytics events. Try again later.' } } })
router.post('/', eventLimiter, optionalAuth, validate({ body: navigationEventBody }), ingestNavigationEvent)
module.exports = router
