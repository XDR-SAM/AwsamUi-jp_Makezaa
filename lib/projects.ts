import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import type { Project, ProjectInput } from "./types";

// --- PUBLIC (respects RLS) ---

export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[projects] getPublishedProjects:", error.message);
    return [];
  }
  return (data as Project[]) ?? [];
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[projects] getFeaturedProjects:", error.message);
    return [];
  }
  return (data as Project[]) ?? [];
}

export async function getRecentProjects(limit = 3): Promise<Project[]> {
  const featured = await getFeaturedProjects();
  if (featured.length >= limit) return featured.slice(0, limit);
  const all = await getPublishedProjects();
  const featuredIds = new Set(featured.map(p => p.id));
  const rest = all.filter(p => !featuredIds.has(p.id));
  return [...featured, ...rest].slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (error) return null;
  return data as Project;
}

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
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
