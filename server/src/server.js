const config = require('./config/env')
const { connectDB, disconnectDB } = require('./config/db')
const app = require('./app')

let server

async function start() {
  console.log('[debug] Starting API server...');
  console.log('[debug] Configured port:', config.port);
  console.log('[debug] PID:', process.pid);

  try {
    await connectDB();
    console.log('[debug] MongoDB connection completed');

    server = app.listen(config.port);

    server.on('listening', () => {
      console.log('[debug] Actual address:', server.address());
      console.log(
        `[server] LEARN LOOP API listening on port ${config.port} (${config.nodeEnv})`
      );
    });

    server.on('error', (err) => {
      console.error('[server] HTTP listener error:', err);
    });

    server.on('close', () => {
      console.error('[server] HTTP listener closed');
    });

    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

  } catch (err) {
    console.error('[server] Startup failed:', err);
    process.exit(1);
  }
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