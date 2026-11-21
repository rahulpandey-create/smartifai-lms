const { z } = require('zod')
const mongoose = require('mongoose')

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), 'Must be a valid ID')
const authBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 UTF-8 bytes.'),
}).strict()
const loginBody = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 UTF-8 bytes.'),
}).strict()
const navigationEventBody = z.object({
  eventId: z.string().uuid().optional(),
  eventName: z.enum(['page_view', 'course_view']),
  pagePath: z.string().trim().min(1).max(256),
  source: z.string().trim().max(100).optional(),
  medium: z.string().trim().max(100).optional(),
  courseId: objectId.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.eventName === 'course_view' && !value.courseId) {
    ctx.addIssue({ code: 'custom', path: ['courseId'], message: 'courseId is required for course_view.' })
  }
})

const objectIdParams = z.object({ id: objectId })
const courseIdParams = z.object({ id: objectId })
const analyticsQuery = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  courseId: objectId.optional(),
  dataset: z.enum(['all', 'demo', 'live']).default('all'),
}).strict().superRefine((value, ctx) => {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'startDate must not be after endDate.' })
  }
})

module.exports = { authBody, loginBody, navigationEventBody, objectIdParams, courseIdParams, analyticsQuery }
