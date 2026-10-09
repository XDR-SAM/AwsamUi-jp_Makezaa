import 'server-only';
import { createPublicClient } from '@/utils/supabase/public';

export type SitemapContent = { slug: string; updated_at: string };

/** Page through published rows; never return a misleading partial sitemap on a database error. */
export async function getSitemapContent(table: 'posts' | 'projects'): Promise<SitemapContent[]> {
  const supabase = createPublicClient();
  const rows: SitemapContent[] = [];
  const batchSize = 1000;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await supabase.from(table).select('slug,updated_at')
      .eq('published', true).order('id').range(offset, offset + batchSize - 1);
    if (error) throw new Error(`Unable to read ${table} for sitemap: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < batchSize) return rows;
  }
}
