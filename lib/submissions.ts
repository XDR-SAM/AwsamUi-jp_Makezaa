import { createAdminClient } from "@/utils/supabase/admin";
import type { ContactSubmission, SubmissionType } from "./types";

export async function getAllSubmissions(): Promise<ContactSubmission[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[submissions] getAllSubmissions:", error.message);
    return [];
  }
  return (data as ContactSubmission[]) ?? [];
}

export async function getSubmissionsByType(type: SubmissionType): Promise<ContactSubmission[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[submissions] getSubmissionsByType:", error.message);
    return [];
  }
  return (data as ContactSubmission[]) ?? [];
}

export async function getSubmissionById(id: string): Promise<ContactSubmission | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ContactSubmission;
}

export async function deleteSubmission(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
  if (error) throw error;
}

export function formatPreferredTime(time: string | null): string {
  if (!time) return "—";
  const [h] = time.split(":");
  const hour = parseInt(h, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${period}`;
}
