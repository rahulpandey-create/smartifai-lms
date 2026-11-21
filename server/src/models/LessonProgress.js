const mongoose = require('mongoose')

const lessonProgressSchema = new mongoose.Schema(
  {
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    startedAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null, index: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
)

lessonProgressSchema.index({ enrollment: 1, lesson: 1 }, { unique: true })
lessonProgressSchema.index({ course: 1, startedAt: 1, completedAt: 1 })
module.exports = mongoose.model('LessonProgress', lessonProgressSchema)
