const path = require('node:path')
const dotenv = require('dotenv')
const { z } = require('zod')

// Load server/.env no matter which directory the process is started from.
// On Render the variables come from the dashboard and no .env file exists (that is fine).
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true })

function isValidOrigin(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value
  } catch {
    return false
  }
}

const required = (name) =>
  z.string({ error: `${name} is required` }).min(1, `${name} is required`)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  MONGODB_URI: required('MONGODB_URI').refine(
    (uri) => /^mongodb(\+srv)?:\/\//.test(uri),
    'MONGODB_URI must start with mongodb:// or mongodb+srv://',
  ),

  JWT_SECRET: required('JWT_SECRET').min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must look like 15m, 12h or 7d')
    .default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(12).default(10),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  ALLOWED_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine(
      (origins) => origins.length > 0 && origins.every(isValidOrigin),
      'ALLOWED_ORIGIN must be comma-separated origins such as https://app.example.com (no path, no trailing slash)',
    ),

  ADMIN_NAME: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_THINKING_LEVEL: z.enum(['minimal', 'low', 'medium', 'high']).default('low'),
})

// Treat empty values (for example "GEMINI_API_KEY=") the same as "not set".
const rawEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined && value.trim() !== ''),
)

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`,
  )
  console.error(
    [
      '',
      '[env] Invalid server configuration:',
      ...lines,
      '',
      'Copy server/.env.example to server/.env and fill in the missing values.',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

const env = parsed.data
const isProduction = env.NODE_ENV === 'production'

module.exports = Object.freeze({
  nodeEnv: env.NODE_ENV,
  isProduction,
  port: env.PORT,
  trustProxy: env.TRUST_PROXY,
  mongoUri: env.MONGODB_URI,
  allowedOrigins: Object.freeze(env.ALLOWED_ORIGIN),
  jwt: Object.freeze({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN }),
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
  cookie: Object.freeze({ sameSite: env.COOKIE_SAME_SITE, secure: isProduction }),
  admin: Object.freeze({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  }),
  ai: Object.freeze({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    thinkingLevel: env.GEMINI_THINKING_LEVEL,
  }),
})