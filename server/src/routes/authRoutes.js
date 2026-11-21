const express = require('express')
const { rateLimit } = require('express-rate-limit')
const controller = require('../controllers/authController')
const validate = require('../middleware/validate')
const { authBody, loginBody } = require('../validators/schemas')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' } },
})

router.post('/signup', authLimiter, validate({ body: authBody }), controller.signup)
router.post('/login', authLimiter, validate({ body: loginBody }), controller.login)
router.post('/logout', requireAuth, controller.logout)
router.get('/me', requireAuth, controller.me)

module.exports = router
