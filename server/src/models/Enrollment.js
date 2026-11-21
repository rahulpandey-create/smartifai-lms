const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrolledAt: { type: Date, default: Date.now, required: true, index: true },
    completedAt: { type: Date, default: null, index: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
)

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })
enrollmentSchema.index({ enrolledAt: 1, course: 1 })
module.exports = mongoose.model('Enrollment', enrollmentSchema)
