const mongoose = require('mongoose')

const EVENT_NAMES = [
  'page_view',
  'user-signup',
  'login',
  'course_view',
  'course_enrollment',
  'lesson_start',
  'lesson_complete',
  'course_complete',
]

const analyticsEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, maxlength: 80 },
    dedupeKey: { type: String, default: undefined, maxlength: 180 },
    eventName: { type: String, enum: EVENT_NAMES, required: true, index: true },
    occurredAt: { type: Date, required: true, index: true },
    receivedAt: { type: Date, required: true, default: Date.now },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, required: true, maxlength: 80, index: true },
    pagePath: { type: String, default: null, maxlength: 256 },
    source: { type: String, default: null, maxlength: 100 },
    medium: { type: String, default: null, maxlength: 100 },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null, index: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    properties: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { versionKey: false, strict: true },
)

analyticsEventSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true })
analyticsEventSchema.index({ eventName: 1, occurredAt: 1, courseId: 1 })
analyticsEventSchema.index({ actorId: 1, occurredAt: -1 })
module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema)
module.exports.EVENT_NAMES = EVENT_NAMES
