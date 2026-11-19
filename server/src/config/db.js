const mongoose = require('mongoose')
const config = require('./env')

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

let listenersAttached = false

function attachListeners() {
  if (listenersAttached) return
  listenersAttached = true

  mongoose.connection.on('error', (err) => console.error(`[db] connection error: ${err.message}`))
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'))
  mongoose.connection.on('reconnected', () => console.log('[db] reconnected'))
}

async function connectDB() {
  attachListeners()

  await mongoose.connect(config.mongoUri, {
    // Fail fast with a readable error (for example an Atlas IP allow-list problem) instead of hanging.
    serverSelectionTimeoutMS: 10_000,
    // Atlas M0 is small and shared; a modest pool is plenty for this app.
    maxPoolSize: 10,
  })

  console.log(`[db] connected (database: ${mongoose.connection.name})`)
  return mongoose.connection
}

async function disconnectDB() {
  await mongoose.disconnect()
}

function getDbStatus() {
  return READY_STATES[mongoose.connection.readyState] || 'unknown'
}

module.exports = { connectDB, disconnectDB, getDbStatus }