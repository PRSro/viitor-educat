/**
 * Environment Configuration
 * 
 * Validates and exports environment variables.
 * Fails fast if required variables are missing.
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// Development mode check
export const isDevelopment = process.env.NODE_ENV !== 'production';

// JWT Secret - Required in production, has fallback in development
export const JWT_SECRET = isDevelopment
  ? getOptionalEnv('JWT_SECRET', 'dev-only-secret-not-for-production')
  : getRequiredEnv('JWT_SECRET');

// Server configuration
export const PORT = parseInt(getOptionalEnv('PORT', '3001'), 10);

// CORS configuration
const defaultOrigins: string[] | boolean = isDevelopment
  ? ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000']
  : true; // Default to allow-all in production if not specified, to avoid Railway "Unable to Connect"

export const ALLOWED_ORIGINS: string[] | boolean = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

// Database URL - Required
export const DATABASE_URL = getRequiredEnv('DATABASE_URL');

// Redis URL - Required in production for distributed rate limiting
export const REDIS_URL = isDevelopment
  ? getOptionalEnv('REDIS_URL', '')
  : getRequiredEnv('REDIS_URL');

// Log configuration on startup (without sensitive values)
export function logConfig(): void {
  console.log('[Config] Environment:', isDevelopment ? 'development' : 'production');
  console.log('[Config] Port:', PORT);
  const originsStr = Array.isArray(ALLOWED_ORIGINS)
    ? ALLOWED_ORIGINS.join(', ')
    : (ALLOWED_ORIGINS === true ? '*' : 'none');
  console.log('[Config] CORS origins:', originsStr);
  console.log('[Config] JWT_SECRET:', JWT_SECRET ? '***configured***' : 'MISSING');
}
