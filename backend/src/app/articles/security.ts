import DOMPurify from 'isomorphic-dompurify';

const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TITLE_LENGTH = 300;
const MAX_SLUG_LENGTH = 100;
const MAX_EXCERPT_LENGTH = 500;

interface SanitizationResult {
  valid: boolean;
  sanitized?: string;
  errors: string[];
}

// Path traversal prevention
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;

  // Prevent path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return false;
  }

  // Only allow lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Length check
  if (slug.length < 1 || slug.length > MAX_SLUG_LENGTH) {
    return false;
  }

  return true;
}

export function sanitizeSlug(slug: string): string {
  return slug
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .toLowerCase();
}

// XSS protection for HTML content
export function sanitizeHtmlContent(html: string): SanitizationResult {
  const errors: string[] = [];

  if (!html || typeof html !== 'string') {
    return { valid: false, errors: ['Content is required'] };
  }

  if (html.length > MAX_CONTENT_SIZE) {
    errors.push(`Content exceeds maximum size of ${MAX_CONTENT_SIZE / 1024 / 1024}MB`);
  }

  // Remove potentially dangerous elements
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'sub', 'sup', 'hr', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'class', 'id',
      'width', 'height', 'border', 'cellpadding', 'cellspacing', 'style',
      'title', 'colspan', 'rowspan'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });

  // Validate sanitized result
  if (sanitized.length === 0 && html.length > 0) {
    errors.push('Content was completely removed by sanitization - may contain unsafe content');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(html)) {
      errors.push('Content contains potentially dangerous patterns');
      break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, sanitized, errors: [] };
}

// Input validation helpers
export function validateTitle(title: string): SanitizationResult {
  const errors: string[] = [];

  if (!title || typeof title !== 'string') {
    return { valid: false, errors: ['Title is required'] };
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, errors: ['Title cannot be empty'] };
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
  }

  // Check for HTML (shouldn't have raw HTML in title)
  if (/<[^>]+>/.test(trimmed)) {
    errors.push('Title should not contain HTML tags');
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, sanitized: trimmed, errors: [] };
}

export function validateExcerpt(excerpt: string | undefined): SanitizationResult {
  if (!excerpt) {
    return { valid: true, sanitized: undefined, errors: [] };
  }

  const errors: string[] = [];
  const trimmed = excerpt.trim();

  if (trimmed.length > MAX_EXCERPT_LENGTH) {
    errors.push(`Excerpt must be ${MAX_EXCERPT_LENGTH} characters or less`);
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, sanitized: trimmed, errors: [] };
}

export function validateUrl(url: string | undefined): SanitizationResult {
  if (!url) {
    return { valid: true, sanitized: undefined, errors: [] };
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, errors: ['URL must use HTTP or HTTPS protocol'], sanitized: undefined };
    }
    return { valid: true, sanitized: url, errors: [] };
  } catch {
    return { valid: false, errors: ['Invalid URL format'], sanitized: undefined };
  }
}

export function validateAuthorId(authorId: string): SanitizationResult {
  const errors: string[] = [];

  if (!authorId || typeof authorId !== 'string') {
    return { valid: false, errors: ['Author ID is required'] };
  }

  // Prevent path traversal
  if (authorId.includes('..') || authorId.includes('/') || authorId.includes('\\')) {
    return { valid: false, errors: ['Invalid author ID format'] };
  }

  // CUID format check (optional)
  if (!/^[^/]+$/.test(authorId)) {
    return { valid: false, errors: ['Invalid author ID format'] };
  }

  return { valid: true, errors: [] };
}

// Rate limiting
import { redisService } from '../core/services/redisService.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = await redisService.get<RateLimitEntry>(`ratelimit:${key}`);

  if (!entry || now > entry.resetAt) {
    await redisService.set(`ratelimit:${key}`, { count: 1, resetAt: now + windowMs }, windowMs / 1000);
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  await redisService.set(`ratelimit:${key}`, entry, Math.ceil((entry.resetAt - now) / 1000));
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export async function clearRateLimit(key: string): Promise<void> {
  await redisService.del(`ratelimit:${key}`);
}

// Content size validation
export function validateContentSize(content: string): SanitizationResult {
  const errors: string[] = [];

  if (!content || typeof content !== 'string') {
    return { valid: false, errors: ['Content is required'] };
  }

  const sizeBytes = Buffer.byteLength(content, 'utf8');

  if (sizeBytes > MAX_CONTENT_SIZE) {
    errors.push(`Content size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum of ${MAX_CONTENT_SIZE / 1024 / 1024}MB`);
  }

  // Warn for very large content but still allow
  if (sizeBytes > MAX_CONTENT_SIZE * 0.8) {
    errors.push('Warning: Content is approaching size limit');
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, errors: [] };
}

// Combined validation
export interface ArticleInputValidation {
  valid: boolean;
  errors: string[];
  sanitized: {
    title: string;
    content: string;
    excerpt?: string;
    slug: string;
    authorId: string;
    sourceUrl?: string;
  };
}

export function validateArticleInput(input: {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  authorId: string;
  sourceUrl?: string;
}): ArticleInputValidation {
  const allErrors: string[] = [];

  // Validate title
  const titleResult = validateTitle(input.title);
  if (!titleResult.valid) allErrors.push(...titleResult.errors);

  // Validate content
  const contentResult = sanitizeHtmlContent(input.content);
  if (!contentResult.valid) allErrors.push(...contentResult.errors);

  // Validate excerpt
  const excerptResult = validateExcerpt(input.excerpt);
  if (!excerptResult.valid) allErrors.push(...excerptResult.errors);

  // Validate slug
  let sanitizedSlug = input.slug || input.title;
  if (!isValidSlug(sanitizedSlug)) {
    sanitizedSlug = sanitizeSlug(sanitizedSlug);
  }

  // Validate authorId
  const authorResult = validateAuthorId(input.authorId);
  if (!authorResult.valid) allErrors.push(...authorResult.errors);

  // Validate sourceUrl
  const urlResult = validateUrl(input.sourceUrl);
  if (!urlResult.valid) allErrors.push(...urlResult.errors);

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors, sanitized: {} as any };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      title: titleResult.sanitized!,
      content: contentResult.sanitized!,
      excerpt: excerptResult.sanitized,
      slug: sanitizedSlug,
      authorId: input.authorId,
      sourceUrl: urlResult.sanitized
    }
  };
}
