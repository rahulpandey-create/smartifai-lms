const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 1200 },
    category: { type: String, required: true, maxlength: 80 },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    estimatedMinutes: { type: Number, min: 1, max: 10000, default: 30 },
    isPublished: { type: Boolean, default: true, index: true },
    isDemo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
)

module.exports = mongoose.model('Course', courseSchema)
