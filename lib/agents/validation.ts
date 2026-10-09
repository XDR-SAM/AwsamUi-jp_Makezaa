import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { AgentError } from './security';

const https = z
  .string()
  .max(2048)
  .url()
  .refine((v) => new URL(v).protocol === 'https:', 'Use an HTTPS URL');
export const uuid = z.string().uuid();
export const page = {
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).max(100000).default(0),
};
export const jobRef = {
  job_id: uuid.optional(),
  lease_token: z.string().min(20).max(200).optional(),
};
export const writeRef = {
  idempotency_key: z.string().min(8).max(160),
  ...jobRef,
};
const cleanHtml = z
  .string()
  .min(1)
  .max(200000)
  .transform((value) =>
    sanitizeHtml(value, {
      allowedTags: [
        'p',
        'br',
        'h2',
        'h3',
        'h4',
        'ul',
        'ol',
        'li',
        'strong',
        'em',
        'blockquote',
        'pre',
        'code',
        'a',
        'img',
        'hr',
        's',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        code: ['class'],
      },
      allowedSchemes: ['https', 'mailto'],
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
      },
    }),
  )
  .refine(
    (v) => v.replace(/<[^>]*>/g, '').trim().length > 0,
    'Content needs readable text',
  );
export const provenance = z
  .object({
    sources: z.array(https).max(30).default([]),
    image_credit: z.string().max(2000).optional(),
  })
  .strict()
  .optional();
const base = {
  title: z.string().trim().min(1).max(250),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: cleanHtml,
  cover_image: https.nullable(),
  published: z.boolean(),
};
export const postFields = z
  .object({
    ...base,
    excerpt: z.string().max(1000).nullable(),
    tags: z.array(z.string().min(1).max(80)).max(30).nullable(),
  })
  .partial()
  .strict();
export const projectFields = z
  .object({
    ...base,
    description: z.string().max(3000).nullable(),
    tech_stack: z.array(z.string().min(1).max(80)).max(30).nullable(),
    live_url: https.nullable(),
    github_url: https.nullable(),
    featured: z.boolean(),
  })
  .partial()
  .strict();
export function parse<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new AgentError(
      result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
        .slice(0, 1500),
      400,
    );
  return result.data;
}
export function validateImage(bytes: Buffer, mime: string) {
  if (!bytes.length || bytes.length > 2 * 1024 * 1024)
    throw new AgentError('Image must be between 1 byte and 2 MiB.', 413);
  const detected = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? 'image/jpeg'
      : bytes.subarray(0, 4).toString() === 'RIFF' &&
          bytes.subarray(8, 12).toString() === 'WEBP'
        ? 'image/webp'
        : ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())
          ? 'image/gif'
          : '';
  if (!detected || detected !== mime)
    throw new AgentError(
      'Use a PNG, JPEG, WebP, or GIF with matching file content.',
      400,
    );
  return (
    {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    } as Record<string, string>
  )[detected];
}
