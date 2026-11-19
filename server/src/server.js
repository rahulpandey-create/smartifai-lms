const config = require('./config/env')
const { connectDB, disconnectDB } = require('./config/db')
const app = require('./app')

let server

async function start() {
  try {
    await connectDB()
  } catch (err) {
    // The driver's error message never includes the password from the connection string.
    console.error(`[server] Could not connect to MongoDB: ${err.message}`)
    console.error('[server] Check MONGODB_URI and, on Atlas, Network Access (IP allow-list).')
    process.exit(1)
  }

  server = app.listen(config.port, () => {
    console.log(`[server] LEARN LOOP API listening on port ${config.port} (${config.nodeEnv})`)
  })

  // Keep idle connections open longer than the proxy in front of us (Render) to avoid sporadic 502s.
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000
}

async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`)

  const forceExit = setTimeout(() => process.exit(1), 10_000)
  forceExit.unref()

  try {
    if (server) await new Promise((resolve) => server.close(resolve))
    await disconnectDB()
    process.exit(0)
  } catch (err) {
    console.error(`[server] Error during shutdown: ${err.message}`)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start()