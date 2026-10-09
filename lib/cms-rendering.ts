import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderCmsContent(content: string): string {
  // Rich-text editor/agent output is HTML. Older records contain plain Markdown.
  const isHtml = /<(?:p|div|h[1-6]|ul|ol|table|blockquote|pre|img|a|strong|em|span)(?:\s|>)/i.test(content);
  if (isHtml) return content.replace(/<(\/?)h1(?=[\s>])/gi, '<$1h2');
  const html = marked.parse(content, { async: false, gfm: true });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'title', 'width', 'height'], code: ['class'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: { h1: 'h2', a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
}
