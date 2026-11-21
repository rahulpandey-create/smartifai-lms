const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    order: { type: Number, required: true, min: 1 },
    content: { type: String, required: true, maxlength: 20000 },
    estimatedMinutes: { type: Number, min: 1, max: 120, default: 5 },
    isDemo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
)

lessonSchema.index({ course: 1, order: 1 }, { unique: true })
module.exports = mongoose.model('Lesson', lessonSchema)
