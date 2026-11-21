const crypto = require('node:crypto')
const AnalyticsEvent = require('../models/AnalyticsEvent')

async function recordEvent({
  eventName,
  actorId = null,
  sessionId,
  pagePath = null,
  source = null,
  medium = null,
  courseId = null,
  lessonId = null,
  enrollmentId = null,
  isDemo = false,
  occurredAt = new Date(),
  dedupeKey,
  eventId = crypto.randomUUID(),
}) {
  const allowedProperties = {
    ...(pagePath ? { pagePath } : {}),
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(courseId ? { courseId: courseId.toString() } : {}),
    ...(lessonId ? { lessonId: lessonId.toString() } : {}),
    ...(enrollmentId ? { enrollmentId: enrollmentId.toString() } : {}),
  }
  const document = {
    eventId,
    ...(dedupeKey ? { dedupeKey } : {}),
    eventName,
    actorId,
    sessionId,
    pagePath,
    source,
    medium,
    courseId,
    lessonId,
    enrollmentId,
    properties: allowedProperties,
    isDemo,
    occurredAt,
    receivedAt: new Date(),
  }

  try {
    return await AnalyticsEvent.create(document)
  } catch (error) {
    if (error.code === 11000 && dedupeKey) {
      return AnalyticsEvent.findOne({ dedupeKey })
    }
    if (error.code === 11000 && eventId) {
      return AnalyticsEvent.findOne({ eventId })
    }
    throw error
  }
}

module.exports = { recordEvent }
