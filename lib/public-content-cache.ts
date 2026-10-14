import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';

export const PUBLIC_CONTENT_TTL = 300;
export const publicContentTag = (kind: 'posts' | 'projects') => `published:${kind}`;

/** Expire anonymous public reads, including renamed and unpublished slugs. */
export function invalidatePublicContent(kind: 'posts' | 'projects') {
  const collection = kind === 'posts' ? '/blog' : '/projects';
  revalidateTag(publicContentTag(kind), { expire: 0 });
  revalidatePath('/');
  revalidatePath(collection);
  revalidatePath(`${collection}/[slug]`, 'page');
  revalidatePath('/sitemap.xml');
}
