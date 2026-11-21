const crypto = require('node:crypto')
const Course = require('../models/Course')
const { recordEvent } = require('../services/eventService')
const AppError = require('../middleware/AppError')

async function ingestNavigationEvent(req, res) {
  const { eventId, eventName, pagePath, source, medium, courseId } = req.body
  if (courseId) {
    const course = await Course.findOne({ _id: courseId, isPublished: true }).select('_id')
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found.')
  }
  const event = await recordEvent({
    eventId: eventId || crypto.randomUUID(),
    eventName,
    actorId: req.user?._id || null,
    sessionId: req.sessionId,
    pagePath,
    source: source || null,
    medium: medium || null,
    courseId: courseId || null,
    isDemo: Boolean(req.user?.isDemo),
    occurredAt: new Date(),
  })
  return res.status(202).json({ success: true, data: { accepted: true, eventId: event.eventId } })
}

module.exports = { ingestNavigationEvent }
