/**
 * SafeHtml Component
 * 
 * Safely renders HTML content with XSS protection.
 * Uses DOMPurify to sanitize content before rendering.
 * 
 * Usage:
 *   <SafeHtml content={userGeneratedHtml} />
 *   <SafeHtml content={lessonContent} className="prose" />
 */

import { sanitizeHtml } from '@/lib/sanitize';

interface SafeHtmlProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function SafeHtml({ content, className, as: Component = 'div' }: SafeHtmlProps) {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

/**
 * SafeText Component
 * 
 * Renders plain text safely (no HTML interpretation).
 * Use when content should never contain HTML.
 */
interface SafeTextProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function SafeText({ content, className, as: Component = 'span' }: SafeTextProps) {
  return <Component className={className}>{content}</Component>;
}
