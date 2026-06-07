import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import type { Post, PostInput } from "./types";

// --- PUBLIC (respects RLS) ---

export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[blog] getPublishedPosts:", error.message);
    return [];
  }
  return (data as Post[]) ?? [];
}

export async function getRecentPosts(limit = 3): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (error) return null;
  return data as Post;
}

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
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
