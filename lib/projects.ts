import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import type { Project, ProjectInput } from "./types";
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { PUBLIC_CONTENT_TTL, publicContentTag, invalidatePublicContent } from './public-content-cache';

// --- PUBLIC (respects RLS) ---

const readPublishedProjects = unstable_cache(async (): Promise<Project[]> => {
  const supabase = createPublicClient();
  const rows: Project[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("projects").select("*")
      .eq("published", true).order("created_at", { ascending: false }).order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}, ['published-projects-v1'], { revalidate: PUBLIC_CONTENT_TTL, tags: [publicContentTag('projects')] });

export const getPublishedProjects = cache(readPublishedProjects);

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getPublishedProjects()).filter(project => project.featured);
}

export async function getRecentProjects(limit = 3): Promise<Project[]> {
  const all = await getPublishedProjects();
  return [...all.filter(project => project.featured), ...all.filter(project => !project.featured)].slice(0, limit);
}

export const getProjectBySlug = cache(unstable_cache(async (slug: string): Promise<Project | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("projects").select("*")
    .eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw error;
  return data as Project | null;
}, ['published-projects-slug-v1'], { revalidate: PUBLIC_CONTENT_TTL, tags: [publicContentTag('projects')] }));

// --- ADMIN (bypasses RLS) ---

export async function getAllProjects(): Promise<Project[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Project;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  invalidatePublicContent('projects');
  return data as Project;
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  invalidatePublicContent('projects');
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  invalidatePublicContent('projects');
}
