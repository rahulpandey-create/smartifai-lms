const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isDemo: this.isDemo,
    createdAt: this.createdAt,
  }
}

module.exports = mongoose.model('User', userSchema)
