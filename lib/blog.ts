import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import type { Post, PostInput } from "./types";
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { PUBLIC_CONTENT_TTL, publicContentTag, invalidatePublicContent } from './public-content-cache';

// --- PUBLIC (respects RLS) ---

const readPublishedPosts = unstable_cache(async (): Promise<Post[]> => {
  const supabase = createPublicClient();
  const rows: Post[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("posts").select("*")
      .eq("published", true).order("created_at", { ascending: false }).order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}, ['published-posts-v1'], { revalidate: PUBLIC_CONTENT_TTL, tags: [publicContentTag('posts')] });

export const getPublishedPosts = cache(readPublishedPosts);

export async function getRecentPosts(limit = 3): Promise<Post[]> {
  return (await getPublishedPosts()).slice(0, limit);
}

export const getPostBySlug = cache(unstable_cache(async (slug: string): Promise<Post | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("posts").select("*")
    .eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw error;
  return data as Post | null;
}, ['published-posts-slug-v1'], { revalidate: PUBLIC_CONTENT_TTL, tags: [publicContentTag('posts')] }));

// --- ADMIN (bypasses RLS) ---

export async function getAllPosts(): Promise<Post[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Post[];
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Post;
}

export async function createPost(input: PostInput): Promise<Post> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  invalidatePublicContent('posts');
  return data as Post;
}

export async function updatePost(id: string, input: Partial<PostInput>): Promise<Post> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  invalidatePublicContent('posts');
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
  invalidatePublicContent('posts');
}
