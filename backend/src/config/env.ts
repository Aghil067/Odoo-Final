import 'dotenv/config';
import { z } from 'zod';
import { isSupportedCountry } from 'libphonenumber-js';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';

export function isPublicStoragePath(directory: string): boolean {
  const target = resolve(directory);
  // Backend commands run from backend/. Reject the whole frontend repository,
  // since development servers may serve more than just its public/ directory.
  return ['..', 'public', 'dist'].some(name => {
    const path = relative(resolve(name), target);
    return path === '' || (!path.startsWith('..') && !isAbsolute(path));
  });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url().refine(value => /^postgres(ql)?:\/\//.test(value), 'PostgreSQL URL required'),
  APP_ORIGIN: z.url().refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'Use a single HTTP(S) origin with no path or trailing slash'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
  DEFAULT_PHONE_COUNTRY: z.string().default('IN').refine(isSupportedCountry, 'Unsupported phone country'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  WARRANTY_STORAGE_DIR: z.string().min(1).default(join(homedir(), '.solar-installation', 'warranty-uploads')).transform(value => resolve(value)).refine(value => !isPublicStoragePath(value), 'Warranty evidence must remain outside repository/public/build'),
  WARRANTY_MAX_FILE_BYTES: z.coerce.number().int().min(1024).max(10485760).default(5242880),
  INSTALLATION_STORAGE_DIR: z.string().min(1).default(join(homedir(), '.solar-installation', 'installation-uploads')).transform(value => resolve(value)).refine(value => !isPublicStoragePath(value), 'Installation storage must be outside repository/public/build paths'),
  INSTALLATION_MAX_FILE_BYTES: z.coerce.number().int().min(1024).max(10485760).default(5242880),
  SURVEY_STORAGE_ADAPTER: z.literal('local').default('local'),
  SURVEY_STORAGE_DIR: z.string().min(1).default(join(homedir(), '.solar-installation', 'survey-uploads')).transform(value => resolve(value)).refine(value => !isPublicStoragePath(value), 'Survey storage must be outside the frontend repository and public/build directories'),
  SURVEY_MAX_FILE_BYTES: z.coerce.number().int().min(1024).max(10485760).default(5242880),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === 'production' && !value.APP_ORIGIN.startsWith('https://')) {
    ctx.addIssue({ code: 'custom', path: ['APP_ORIGIN'], message: 'Production requires HTTPS' });
  }
  if (value.COOKIE_SAME_SITE === 'none' && value.NODE_ENV !== 'production') {
    ctx.addIssue({ code: 'custom', path: ['COOKIE_SAME_SITE'], message: 'Cross-site cookies require production HTTPS' });
  }
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  // Never print environment values, which can contain database passwords.
  throw new Error(`Invalid environment: ${result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
}
export const env = result.data;
